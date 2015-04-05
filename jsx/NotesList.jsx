/* jshint -W097 */
'use strict';

var Note = require('./Note.jsx');

var NotesList = React.createClass({

  render: function () {
    var self = this;
    return (
      <div id="notes-list">
        {this.props.notes.map(function(note) {
          return <Note
            compact={self.props.compact}
            note={note}
            key={note.IDStr}
            myNotes={self.props.myNotes}
            delUndelNoteCb={self.props.delUndelNoteCb}
            makeNotePublicPrivateCb={self.props.makeNotePublicPrivateCb}
            startUnstarNoteCb={self.props.startUnstarNoteCb}
            editCb={self.props.editCb}
          />;
        })}
      </div>
    );
  }
});

module.exports = NotesList;
