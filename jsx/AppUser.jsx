/* jshint -W097,-W117 */
'use strict';

var utils = require('./utils.js');
var NotesList = require('./NotesList.jsx');
var Top = require('./Top.jsx');
var LeftSidebar = require('./LeftSidebar.jsx');
var Composer = require('./Composer.jsx');
var FullComposer = require('./FullComposer.jsx');

function tagsFromNotes(notes) {
  var tags = {
    __all: 0,
    __deleted: 0,
    __public: 0,
    __private: 0,
    __starred: 0,
  };
  if (!notes) {
    return {};
  }

  notes.map(function (note) {
    // a deleted note won't show up under other tags or under "all" or "public"
    if (note.IsDeleted) {
      tags.__deleted += 1;
      return;
    }

    tags.__all += 1;
    if (note.IsStarred) {
      tags.__starred += 1;
    }

    if (note.IsPublic) {
      tags.__public += 1;
    } else {
      tags.__private += 1;
    }

    if (note.Tags) {
      note.Tags.map(function (tag) {
        utils.dictInc(tags, tag);
      });
    }
  });

  return tags;
}

var AppUser = React.createClass({
  getInitialState: function() {
    return {
      allNotes: [],
      selectedNotes: [],
      selectedTag: "__all",
      loggedInUserHandle: "",
      noteBeingEdited: null
    };
  },

  handleTagSelected: function(tag) {
    console.log("selected tag: ", tag);
    var selectedNotes = utils.filterNotesByTag(this.state.allNotes, tag);
    this.setState({
      selectedNotes: selectedNotes,
      selectedTag: tag
    });
  },

  updateNotes: function() {
    // TODO: url-escape uri?
    var userHandle = this.props.notesUserHandle;
    console.log("updateNotes: userHandle=", userHandle);
    var uri = "/api/getnotes.json?user=" + userHandle;
    console.log("updateNotes: uri=", uri);
    $.get(uri, function(json) {
      var allNotes = json.Notes;
      if (!allNotes) {
        allNotes = [];
      }
      var tags = tagsFromNotes(allNotes);
      var selectedTag = this.state.selectedTag;
      var selectedNotes = utils.filterNotesByTag(allNotes, selectedTag);
      this.setState({
        allNotes: allNotes,
        selectedNotes: selectedNotes,
        tags: tags,
        loggedInUserHandle: json.LoggedInUserHandle
      });
    }.bind(this));
  },

  componentDidMount: function() {
    key('ctrl+f', utils.focusSearch);
    this.updateNotes();
  },

  componentWillUnmount: function() {
    key.unbind('ctrl+f', utils.focusSearch);
  },

  createNewTextNote: function(s) {
    s = s.trim();
    var data = {
      format: "text",
      content: s
    };
    $.post( "/api/createorupdatenote.json", data, function() {
      this.updateNotes();
    }.bind(this))
    .fail(function() {
      alert( "error creating new note" );
    });
  },

  // TODO: after delete/undelete should show a message at the top
  // with 'undo' link
  delUndelNote: function(note) {
    var data = {
      noteIdHash: note.IDStr
    };
    if (note.IsDeleted) {
      $.post( "/api/undeletenote.json", data, function() {
        this.updateNotes();
      }.bind(this))
      .fail(function() {
        alert( "error undeleting a note");
      });
    } else {
      $.post( "/api/deletenote.json", data, function() {
        this.updateNotes();
      }.bind(this))
      .fail(function() {
        alert( "error deleting a note");
      });
    }
  },

  makeNotePublicPrivate: function(note) {
    var data = {
      noteIdHash: note.IDStr
    };
    if (note.IsPublic) {
      $.post( "/api/makenoteprivate.json", data, function() {
        this.updateNotes();
      }.bind(this))
      .fail(function() {
        alert( "error making note private");
      });
    } else {
      $.post( "/api/makenotepublic.json", data, function() {
        this.updateNotes();
      }.bind(this))
      .fail(function() {
        alert( "error making note private");
      });
    }
  },

  startUnstarNote: function(note) {
    var data = {
      noteIdHash: note.IDStr
    };
    if (note.IsStarred) {
      $.post( "/api/unstarnote.json", data, function() {
        this.updateNotes();
      }.bind(this))
      .fail(function() {
        alert( "error unstarring note");
      });
    } else {
      $.post( "/api/starnote.json", data, function() {
        this.updateNotes();
      }.bind(this))
      .fail(function() {
        alert( "error starring note");
      });
    }
  },

  saveNote: function(note) {
    console.log("saveNote: " + note);
    // TODO: save note if changed
    this.setState({
      noteBeingEdited: null
    });

    /*s = s.trim();
    var data = {
      format: "text",
      content: s
    };
    $.post( "/api/createorupdatenote.json", data, function() {
      this.updateNotes();
    }.bind(this))
    .fail(function() {
      alert( "error creating new note" );
    });*/
  },

  cancelNoteEdit: function(note) {
    console.log("cancelNoteEdit: " + note.IDStr);
    this.setState({
      noteBeingEdited: null
    });
  },

  editNote: function(note) {
    console.log("AppUser.editNote: " + note);
    var noteCopy = utils.deepCloneObject(note);
    this.setState({
      noteBeingEdited: noteCopy
    });
  },

  render: function() {
    var compact = false;
    var isLoggedIn = this.state.loggedInUserHandle !== "";

    var myNotes = isLoggedIn && (this.props.notesUserHandle == this.state.loggedInUserHandle);
    return (
        <div>
            <Top isLoggedIn={isLoggedIn}
              loggedInUserHandle={this.state.loggedInUserHandle}
              notesUserHandle={this.props.notesUserHandle}
            />
            <LeftSidebar tags={this.state.tags}
              isLoggedIn={isLoggedIn}
              myNotes={myNotes}
              onTagSelected={this.handleTagSelected}
              selectedTag={this.state.selectedTag}
            />
            <NotesList
              notes={this.state.selectedNotes}
              myNotes={myNotes}
              compact={compact}
              delUndelNoteCb={this.delUndelNote}
              makeNotePublicPrivateCb={this.makeNotePublicPrivate}
              startUnstarNoteCb={this.startUnstarNote}
              editCb={this.editNote}
            />
            <Composer createNewTextNoteCb={this.createNewTextNote}/>
            <FullComposer
              note={this.state.noteBeingEdited}
              saveNoteCb={this.saveNote}
              cancelNoteEditCb={this.cancelNoteEdit}/>
        </div>
    );
  }
});

function userStart() {
  console.log("gNotesUserHandle: ", gNotesUserHandle);
  React.render(
    <AppUser notesUserHandle={gNotesUserHandle}/>,
    document.getElementById('root')
  );
}

window.userStart = userStart;

module.exports = AppUser;
