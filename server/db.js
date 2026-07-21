import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data_store.json');

// Mongoose Schema Definitions for MongoDB Atlas
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  googleId: { type: String, default: null },
  email: { type: String, default: null },
  name: { type: String, required: true },
  avatar: { type: String, default: '🎮' },
  picture: { type: String, default: null },
  isGoogle: { type: Boolean, default: false },
  elo: { type: Number, default: 1000 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 }
}, { timestamps: true });

const MatchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  gameType: String,
  gameName: String,
  player1: { id: String, name: String, avatar: String, picture: String },
  player2: { id: String, name: String, avatar: String, picture: String },
  winner: String,
  isDraw: Boolean,
  score: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Match = mongoose.model('Match', MatchSchema);

class StorageAdapter {
  constructor() {
    this.isMongoConnected = false;
    this.localData = this.loadLocalData();
    this.initMongo();
  }

  async initMongo() {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      try {
        await mongoose.connect(mongoUri);
        this.isMongoConnected = true;
        console.log('🍃 Connected to MongoDB Atlas cluster!');
      } catch (err) {
        console.warn('⚠️ MongoDB Atlas connection warning:', err.message, '- Falling back to local storage.');
      }
    } else {
      console.log('💡 No MONGODB_URI provided. Operating in local JSON storage mode.');
    }
  }

  loadLocalData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      }
    } catch (err) {
      console.error('Error loading data_store.json:', err.message);
    }
    // Clean initial state without fake dummy records
    const initData = {
      users: [],
      matches: []
    };
    this.saveLocalData(initData);
    return initData;
  }

  saveLocalData(data) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data || this.localData, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write local data:', err.message);
    }
  }

  async getUsers() {
    if (this.isMongoConnected) {
      try {
        const users = await User.find().sort({ elo: -1 }).lean();
        return users;
      } catch (e) {
        console.error('Mongo getUsers error:', e);
      }
    }
    return this.localData.users.sort((a, b) => b.elo - a.elo);
  }

  async getMatches(userId = null) {
    if (this.isMongoConnected) {
      try {
        const query = userId
          ? { $or: [{ 'player1.id': userId }, { 'player2.id': userId }] }
          : {};
        const matches = await Match.find(query).sort({ createdAt: -1 }).limit(50).lean();
        return matches;
      } catch (e) {
        console.error('Mongo getMatches error:', e);
      }
    }

    let matches = this.localData.matches;
    if (userId) {
      matches = matches.filter(m => m.player1?.id === userId || m.player2?.id === userId);
    }
    return matches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async upsertUser({ userId, name, avatar, picture, googleId, email, isGoogle }) {
    let user = this.localData.users.find(u => u.id === userId || (googleId && u.googleId === googleId));

    if (!user) {
      user = {
        id: userId || 'usr_' + Math.random().toString(36).substring(2, 9),
        googleId: googleId || null,
        email: email || null,
        name: name || `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
        avatar: avatar || '🎲',
        picture: picture || null,
        isGoogle: !!isGoogle,
        elo: 1000,
        wins: 0,
        losses: 0,
        draws: 0
      };
      this.localData.users.push(user);
    } else {
      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
      if (picture) user.picture = picture;
      if (googleId) user.googleId = googleId;
      if (email) user.email = email;
      if (isGoogle !== undefined) user.isGoogle = isGoogle;
    }

    this.saveLocalData();

    if (this.isMongoConnected) {
      try {
        await User.findOneAndUpdate({ id: user.id }, user, { upsert: true, new: true });
      } catch (err) {
        console.error('Mongo upsertUser error:', err);
      }
    }

    return user;
  }

  async recordMatch({ gameType, gameName, player1, player2, winner, isDraw, score }) {
    const match = {
      id: 'match_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      gameType,
      gameName,
      player1: { id: player1.id, name: player1.name, avatar: player1.avatar || '🎮', picture: player1.picture || null },
      player2: { id: player2.id, name: player2.name, avatar: player2.avatar || '🕹️', picture: player2.picture || null },
      winner: isDraw ? 'Draw' : winner,
      isDraw: !!isDraw,
      score: score || (isDraw ? 'Draw' : 'Victory'),
      createdAt: new Date().toISOString()
    };

    this.localData.matches.unshift(match);
    if (this.localData.matches.length > 50) {
      this.localData.matches = this.localData.matches.slice(0, 50);
    }

    const p1 = await this.upsertUser(player1);
    const p2 = await this.upsertUser(player2);

    if (isDraw) {
      p1.draws += 1;
      p2.draws += 1;
    } else if (winner === player1.name) {
      p1.wins += 1;
      p2.losses += 1;
      p1.elo += 15;
      p2.elo = Math.max(800, p2.elo - 10);
    } else {
      p2.wins += 1;
      p1.losses += 1;
      p2.elo += 15;
      p1.elo = Math.max(800, p1.elo - 10);
    }

    this.saveLocalData();

    if (this.isMongoConnected) {
      try {
        await Match.create(match);
        await User.findOneAndUpdate({ id: p1.id }, p1);
        await User.findOneAndUpdate({ id: p2.id }, p2);
      } catch (err) {
        console.error('Mongo record match error:', err);
      }
    }

    return match;
  }
}

export const db = new StorageAdapter();
