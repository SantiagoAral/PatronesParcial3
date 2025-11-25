class HandleDisconnect {
    execute(session, broadcastCallback) {
        for (const roomId of session.subscribedRooms) {
            broadcastCallback(roomId, { type: "USER_LEAVE", user: session.user.username });
        }
    }
}

module.exports = HandleDisconnect;
