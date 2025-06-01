const jwt = require('jsonwebtoken');
const User = require('../models/user');

class PokerPlayer {
    constructor(socketio, gameSocket) {
        this.socketio = socketio;
        this.gameSocket = gameSocket;
        this.currentTable = undefined;
        this.currentSeat = undefined;
        this.user = undefined;

        gameSocket.on('disconnect', this.disconnectFromTable);
        gameSocket.on('leaveTable', this.disconnectFromTable);

        gameSocket.on('createTable', this.createTable);
        gameSocket.on('joinTable', this.joinActiveTable);
        gameSocket.on('raiseTable', this.raiseTable);
        gameSocket.on('sitTable', this.sitTable);
        gameSocket.on('foldTable', this.foldTable);
        gameSocket.on('checkTable', this.checkTable);
        gameSocket.on('callTable', this.callTable);
        gameSocket.on('betTable', this.betTable);

        this.setupVideoChat();
    }

    setupVideoChat = () => {
        this.gameSocket.on('videocallTable', (data) => {
            console.log('call made');
            this.socketio.to(data.userToCall).emit('callIncoming', {
                signal: data.signalData,
                from: data.from,
            });
        });
        this.gameSocket.on('acceptCall', (data) => {
            console.log('call accepted');
            this.socketio.to(data.to).emit('callAccepted', data.signal);
        });
    };

    disconnectFromTable = () => {
        // lógica para sair da mesa
    };

    joinActiveTable = (data) => {
        this.disconnectFromTable();
        const { tableId } = data;
        const tableRoom = this.socketio.sockets.adapter.rooms[tableId];
        const table = activeTables[tableId];

        if (tableRoom === undefined || table === undefined) {
            this.gameSocket.emit('status', 'Table does not exist');
            return;
        }
        if (table.joinTable(this)) {
            // lógica para entrar na mesa
        }
    };

    // Implemente os outros métodos: createTable, raiseTable, sitTable, foldTable, checkTable, callTable, betTable
}

module.exports = PokerPlayer;