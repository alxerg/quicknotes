// http://blog.vjeux.com/2013/javascript/scroll-position-with-react.html
import React from 'react';
import ReactDOM from 'react-dom';
import Note from './Note.jsx';
import * as ni from './noteinfo.js';

const maxInitialNotes = 50;

function truncateNotes(notes) {
  if (maxInitialNotes != -1 && notes.length >= maxInitialNotes) {
    return notes.slice(0, maxInitialNotes);
  }
  return notes;
}

export default class NotesList extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.handleScroll = this.handleScroll.bind(this);

    this.state = {
      notes: truncateNotes(props.notes)
    };
  }

  componentWillReceiveProps(nextProps) {
    let node = ReactDOM.findDOMNode(this);
    node.scrollTop = 0;
    this.setState({
      notes: truncateNotes(nextProps.notes)
    });
  }

  handleScroll(e) {
    e.preventDefault();
    const nShowing = this.state.notes.length;
    const total = this.props.notes.length;
    if (nShowing >= total) {
      return;
    }
    const node = e.target;
    const top = node.scrollTop;
    const dy = node.scrollHeight;
    // a heuristic, maybe push it down
    const addMore = top > dy / 2;
    if (!addMore) {
      return;
    }
    //console.log("top: " + top + " height: " + dy);
    let last = nShowing + 10;
    if (last > total) {
      last = total;
    }
    let notes = this.state.notes;
    for (let i = nShowing; i < last; i++) {
      notes.push(this.props.notes[i]);
    }
    //console.log("new number of notes: " + notes.length);
    this.setState({
      notes: notes,
    });
  }

  render() {
    return (
      <div id="notes-list" onScroll={ this.handleScroll }>
        <div className="wrapper">
          { this.state.notes.map((note) => {
              const key = `${ni.IDStr(note)}-${ni.CurrentVersion(note)}`;
              return <Note compact={ this.props.compact }
                       note={ note }
                       key={ key }
                       showingMyNotes={ this.props.showingMyNotes } />;
            }) }
        </div>
      </div>
      );
  }
}

NotesList.propTypes = {
  notes: React.PropTypes.array.isRequired,
  compact: React.PropTypes.bool.isRequired,
  showingMyNotes: React.PropTypes.bool.isRequired
};
