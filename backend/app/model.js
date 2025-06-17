import bcrypt from "bcryptjs";
const { hash, compare } = bcrypt;
export class Image {
  constructor(id, originalName, url, lastChange, album, fileName, history) {
    this.id = id;
    this.originalName = originalName;
    this.url = url;
    this.lastChange = lastChange;
    this.album = album;
    this.fileName = fileName;
    this.history = history;
  }
}

export class Tag {
  constructor(id, name, popularity = 0) {
    this.id = id;
    this.name = name;
    this.popularity = popularity;
  }
}

export class User {
  constructor(id, name, lastName, email, password, profilePicture = null) {
    this.id = id;
    this.name = name;
    this.lastName = lastName;
    this.email = email;
    this.confirmed = false;
    this.password = password;
    this.profilePicture = profilePicture;
    Users.push(this);
  }
}
export const Users = [];

export const Images = [];

export const tagsRaw = [
  // "#love",
  // "#instagood",
  // "#fashion",
  // "#instagram",
  // "#photooftheday",
  // "#art",
  // "#photography",
  // "#beautiful",
  // "#nature",
  // "#picoftheday",
  // "#travel",
  // "#happy",
  // "#cute",
  // "#instadaily",
  // "#style",
  // "#tbt",
  // "#repost",
  // "#followme",
  // "#summer",
  // "#reels",
  // "#like4like",
  // "#beauty",
  // "#fitness",
  // "#food",
  // "#instalike",
];

export const tagsJson = [];

export function convertTagsToJSON() {
  tagsRaw.forEach((tag) => {
    if (!tagsJson.includes(tag)) {
      tagsJson.push(
        new Tag(tagsJson.length + 1, tag, Math.floor(Math.random() * 1000))
      );
    }
  });

  console.log("Tags converted to JSON format:", tagsJson);
  return;
}

convertTagsToJSON();
