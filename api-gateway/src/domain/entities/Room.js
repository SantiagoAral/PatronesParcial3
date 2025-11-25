class Room {
    constructor({ id, name, is_private, password_hash }) {
        this.id = id;
        this.name = name;
        this.is_private = is_private;
        this.password_hash = password_hash;
    }
}

module.exports = Room;
