CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  username varchar(100) UNIQUE NOT NULL,
  password_hash varchar(200) NOT NULL,
  created_at timestamp default now()
);
CREATE TABLE IF NOT EXISTS rooms (
  id serial PRIMARY KEY,
  name varchar(200) NOT NULL,
  is_private boolean default false,
  password_hash varchar(200)
);
CREATE TABLE IF NOT EXISTS room_members (
  user_id int REFERENCES users(id),
  room_id int REFERENCES rooms(id),
  joined_at timestamp default now(),
  PRIMARY KEY(user_id, room_id)
);
CREATE TABLE IF NOT EXISTS messages (
  id serial PRIMARY KEY,
  room_id int REFERENCES rooms(id),
  user_id int REFERENCES users(id),
  content text NOT NULL,
  created_at timestamp default now()
);