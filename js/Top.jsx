import React, { Component, PropTypes } from 'react';
import LogInLink from './LogInLink.jsx';
import keymaster from 'keymaster';
import * as action from './action.js';
import * as u from './utils.js';

// by default all keypresses are filtered
function keyFilter(event) {
  if (event.keyCode == 27) {
    // allow ESC always
    return true;
  }
  // standard key filter, disable if inside those elements
  const tag = (event.target || event.srcElement).tagName;
  return !(tag == 'INPUT' || tag == 'SELECT' || tag == 'TEXTAREA');
}

export default class Top extends Component {
  constructor(props, context) {
    super(props, context);

    this.handleEditNewNote = this.handleEditNewNote.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleInputKeyDown = this.handleInputKeyDown.bind(this);
  }

  componentDidMount() {
    keymaster.filter = keyFilter;
    keymaster('ctrl+f', u.focusSearch);
    keymaster('ctrl+n', () => action.editNewNote());
    //keymaster('ctrl+e', u.focusNewNote);
  }

  componentWillUnmount() {
    keymaster.unbind('ctrl+f');
    keymaster.unbind('ctrl+n');
    //keymaster.unbind('ctrl+e');
  }

  handleInputKeyDown(e) {
    // on ESC loose focus and reset the value
    if (e.keyCode == 27) {
      e.preventDefault();
      e.target.blur();
      e.target.value = '';
      action.clearSearchTerm();
    }
  }

  handleInputChange(e) {
    action.setSearchTerm(e.target.value);
  }

  renderSearchInput() {
    const userHandle = this.props.notesUserHandle;
    if (userHandle === '') {
      return;
    }
    let placeholder = 'Search public notes by ' + userHandle + ' (Ctrl-F)';
    if (userHandle == gLoggedInUserHandle) {
      placeholder = 'Search your notes (Ctrl-F)';
    }
    return (
      <input name="search"
        id="search-input"
        onKeyDown={ this.handleInputKeyDown }
        onChange={ this.handleInputChange }
        type="text"
        autoComplete="off"
        autoCapitalize="off"
        placeholder={ placeholder } />
      );
  }

  handleEditNewNote(e) {
    e.preventDefault();
    console.log('Top.handleEditNewNote');
    action.editNewNote();
  }

  renderNewNote() {
    if (this.props.isLoggedIn) {
      return (
        <a id="new-note"
          title="Create new note (ctrl-n)"
          href="#"
          onClick={ this.handleEditNewNote }><i className="icn-plus"></i></a>
        );
    }
  }

  render() {
    return (
      <div id="header">
        <a id="logo" className="logo colored" href="/">QuickNotes</a>
        { this.renderNewNote() }
        { this.renderSearchInput() }
        <LogInLink isLoggedIn={ this.props.isLoggedIn } loggedInUserHandle={ this.props.loggedInUserHandle } />
      </div>
      );
  }
}

Top.propTypes = {
  isLoggedIn: PropTypes.bool.isRequired,
  loggedInUserHandle: PropTypes.string,
  notesUserHandle: PropTypes.string
};
