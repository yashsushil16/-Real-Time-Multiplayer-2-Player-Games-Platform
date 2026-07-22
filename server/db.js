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

  async mergeGuestAccount(guestUserId, googleUserId) {
    if (!guestUserId || !googleUserId || guestUserId === googleUserId) return null;

    // Load local users
    const guestUserIndex = this.localData.users.findIndex(u => u.id === guestUserId);
    const googleUser = this.localData.users.find(u => u.id === googleUserId);

    if (guestUserIndex !== -1 && googleUser) {
      const guestUser = this.localData.users[guestUserIndex];

      // Merge stats
      if (googleUser.wins === 0 && googleUser.losses === 0 && googleUser.draws === 0 && googleUser.elo === 1000) {
        googleUser.wins = guestUser.wins;
        googleUser.losses = guestUser.losses;
        googleUser.draws = guestUser.draws;
        googleUser.elo = guestUser.elo;
      } else {
        googleUser.wins += guestUser.wins;
        googleUser.losses += guestUser.losses;
        googleUser.draws += guestUser.draws;
        googleUser.elo = Math.max(googleUser.elo, guestUser.elo);
      }

      // Remove guest user from local users list
      this.localData.users.splice(guestUserIndex, 1);

      // Update local matches history where the guest played
      this.localData.matches.forEach(m => {
        if (m.player1 && m.player1.id === guestUserId) {
          m.player1.id = googleUserId;
          m.player1.name = googleUser.name;
          m.player1.picture = googleUser.picture;
          m.player1.avatar = googleUser.avatar;
        }
        if (m.player2 && m.player2.id === guestUserId) {
          m.player2.id = googleUserId;
          m.player2.name = googleUser.name;
          m.player2.picture = googleUser.picture;
          m.player2.avatar = googleUser.avatar;
        }
      });

      this.saveLocalData();
    }

    // Update MongoDB if connected
    if (this.isMongoConnected) {
      try {
        const guestUserDb = await User.findOne({ id: guestUserId });
        const googleUserDb = await User.findOne({ id: googleUserId });

        if (guestUserDb && googleUserDb) {
          // Merge stats in MongoDB
          if (googleUserDb.wins === 0 && googleUserDb.losses === 0 && googleUserDb.draws === 0 && googleUserDb.elo === 1000) {
            googleUserDb.wins = guestUserDb.wins;
            googleUserDb.losses = guestUserDb.losses;
            googleUserDb.draws = guestUserDb.draws;
            googleUserDb.elo = guestUserDb.elo;
          } else {
            googleUserDb.wins += guestUserDb.wins;
            googleUserDb.losses += guestUserDb.losses;
            googleUserDb.draws += guestUserDb.draws;
            googleUserDb.elo = Math.max(googleUserDb.elo, guestUserDb.elo);
          }
          await googleUserDb.save();
          await User.deleteOne({ id: guestUserId });
        }

        // Update MongoDB matches
        await Match.updateMany(
          { 'player1.id': guestUserId },
          { 
            $set: { 
              'player1.id': googleUserId, 
              'player1.name': googleUser ? googleUser.name : (googleUserDb ? googleUserDb.name : 'Player'), 
              'player1.picture': googleUser ? googleUser.picture : (googleUserDb ? googleUserDb.picture : null),
              'player1.avatar': googleUser ? googleUser.avatar : (googleUserDb ? googleUserDb.avatar : '🎮') 
            } 
          }
        );
        await Match.updateMany(
          { 'player2.id': guestUserId },
          { 
            $set: { 
              'player2.id': googleUserId, 
              'player2.name': googleUser ? googleUser.name : (googleUserDb ? googleUserDb.name : 'Player'), 
              'player2.picture': googleUser ? googleUser.picture : (googleUserDb ? googleUserDb.picture : null),
              'player2.avatar': googleUser ? googleUser.avatar : (googleUserDb ? googleUserDb.avatar : '🎮') 
            } 
          }
        );
      } catch (err) {
        console.error('Mongo merge guest account error:', err);
      }
    }

    // Return the updated Google user
    if (this.isMongoConnected) {
      try {
        return await User.findOne({ id: googleUserId }).lean();
      } catch (err) {
        console.error('Mongo find user error after merge:', err);
      }
    }
    return this.localData.users.find(u => u.id === googleUserId);
  }
}

export const db = new StorageAdapter();
