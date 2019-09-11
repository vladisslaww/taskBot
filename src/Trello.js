const axios = require('axios');
const _ = require('lodash/core');
const queryString = require('query-string');

module.exports = class Trello
{
  constructor (key, token) {
    this.key = key;
    this.token = token;
    this.baseUrl = 'https://api.trello.com/1'
    this.config = {
      headers: {
        host: 'api.trello.com',
      },
    };

  }

  createRequest(url, method = 'GET', query={}, data={}) {
    query.key = this.key;
    query.token = this.token;
    query = queryString.stringify(query);

    const config = _.clone(this.config);
    config.url = `${this.baseUrl}${url}?${query}`;
    config.method = method;

    return axios(config);
  }

  createBoard () {
    const query = {
      name: 'TaskBot Board',
      idBoardSource: '5ca07c20caf75346e2ea4d5c'
    };

    return this.createRequest('/boards/', 'POST', query)
  }

  getLists(boardId) {
    return this.createRequest(`/boards/${boardId}/lists`)
  }

  getCards(listID) {
    return this.createRequest(`/list/${listID}/cards`);
  }

  addCard (name, desc = null, listID) {
    const query = {
      name: name,
      idList: listID,
    };
    if (desc) query.desc = desc;

    return this.createRequest('/cards', 'POST', query);
  }

  deleteCard (cardID) {
    return this.createRequest('/')
  }

  addMember (email, boardId) {
    const query = {
      email: email,
    };

    return this.createRequest(`/boards/${boardId}/members`, 'PUT', query);
  }

  getBoardFromList (listId) {
    return this.createRequest(`/lists/${listId}/board`, 'GET');
  }

  getMembersFromBoard (boardId) {
    return this.createRequest(`/boards/${boardId}/members`);
  }

  addMemberToCard (cardId, memberId) {
    return this.createRequest(`/cards/${cardId}/members`, 'POST', {value: memberId});
  }

};