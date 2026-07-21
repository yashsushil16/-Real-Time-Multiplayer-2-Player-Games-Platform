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
  name: { type: String, required: true },
  avatar: { type: String, default: '🎮' },
  elo: { type: Number, default: 1000 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 }
}, { timestamps: true });

const MatchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  gameType: String,
  gameName: String,
  player1: { name: String, avatar: String },
  player2: { name: String, avatar: String },
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
    const initData = {
      users: [
        { id: 'usr_guest_1', name: 'RetroGamer', avatar: '🎮', elo: 1250, wins: 12, losses: 4, draws: 1 },
        { id: 'usr_guest_2', name: 'PixelMaster', avatar: '👾', elo: 1180, wins: 9, losses: 6, draws: 2 },
        { id: 'usr_guest_3', name: 'NeonKnight', avatar: '⚔️', elo: 1120, wins: 7, losses: 5, draws: 0 }
      ],
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

  getUsers() {
    return this.localData.users.sort((a, b) => b.elo - a.elo);
  }

  getMatches() {
    return this.localData.matches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  upsertUser(userId, name, avatar) {
    let user = this.localData.users.find(u => u.id === userId);
    if (!user) {
      user = {
        id: userId,
        name: name || `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
        avatar: avatar || '🎲',
        elo: 1000,
        wins: 0,
        losses: 0,
        draws: 0
      };
      this.localData.users.push(user);
    } else {
      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
    }
    this.saveLocalData();

    if (this.isMongoConnected) {
      User.findOneAndUpdate({ id: userId }, user, { upsert: true, new: true }).catch(err => console.error('Mongo sync error:', err));
    }

    return user;
  }

  recordMatch({ gameType, gameName, player1, player2, winner, isDraw, score }) {
    const match = {
      id: 'match_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      gameType,
      gameName,
      player1: { name: player1.name, avatar: player1.avatar || '🎮' },
      player2: { name: player2.name, avatar: player2.avatar || '🕹️' },
      winner: isDraw ? 'Draw' : winner,
      isDraw: !!isDraw,
      score: score || (isDraw ? 'Draw' : 'Victory'),
      createdAt: new Date().toISOString()
    };

    this.localData.matches.unshift(match);
    if (this.localData.matches.length > 50) {
      this.localData.matches = this.localData.matches.slice(0, 50);
    }

    const p1 = this.upsertUser(player1.id, player1.name, player1.avatar);
    const p2 = this.upsertUser(player2.id, player2.name, player2.avatar);

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
      Match.create(match).catch(err => console.error('Mongo record match error:', err));
    }

    return match;
  }
}

export const db = new StorageAdapter();
