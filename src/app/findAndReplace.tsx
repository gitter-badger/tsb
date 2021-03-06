import React = require("react");
var ReactDOM = require('react-dom');
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import * as utils from "../common/utils";
import * as styles from "./styles/styles";
import * as state from "./state/state";
import * as commands from "./commands/commands";
import {connect} from "react-redux";
import {Icon} from "./icon";


export interface Props extends React.Props<any> {
    // connected using redux
    findQuery?: FindOptions;
}
export interface State {
}


let labelStyle = {
    color: 'grey',
    padding: '4px'
}

let inputCodeStyle = {
    fontFamily: 'monospace',
}
let inputBlackStyle = {
    backgroundColor: '#333',
    color: 'white',
    outline: 'none',
    padding: '2px',
    border: '2px solid #3C3C3C',
    transition: 'border .2s',
    ':focus':{
        border: '2px solid #0090E0',
        boxShadow: '0px 0px 1px 1px #0090E0'
    }
}
let tipMessageStyle = {
    color: 'grey',
    lineHeight: '1.5rem'
}
var keyboardShortCutStyle = {
    border: '2px solid',
    borderRadius: '6px',
    padding: '2px',
    fontSize: '.7rem',
    backgroundColor: 'black',
}
let searchOptionsLabelStyle = {
    color: 'grey',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor:'pointer',
    paddingLeft: '5px',
    paddingRight: '5px',
}

@connect((state: state.StoreState): Props => {
    return {
        findQuery: state.findOptions
    };
})
@ui.Radium
export class FindAndReplace extends BaseComponent<Props, State>{

    componentDidMount() {
        this.disposible.add(commands.findAndReplace.on(() => {
            state.setFindOptionsIsShown(true);
            this.findInput().select();
            this.replaceInput().select();
            this.findInput().focus();
        }));

        this.disposible.add(commands.esc.on(() => {
            state.setFindOptionsIsShown(false);
            this.findInput().focus();
        }));
    }

    refs: {
        [string: string]: any;
        find: JSX.Element;
        replace: JSX.Element;
        regex: {refs:{input: JSX.Element}};
        caseInsensitive: {refs:{input: JSX.Element}};
        fullWord: {refs:{input: JSX.Element}};
    }
    findInput = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.find);
    replaceInput = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.replace);
    regexInput = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.regex.refs.input);
    caseInsensitiveInput = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.caseInsensitive.refs.input);
    fullWordInput = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.fullWord.refs.input);

    replaceWith = () => this.replaceInput().value;
    // searchLocation = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.find);

    render() {
        let shownStyle = this.props.findQuery.isShown ? {} : { display: 'none' };

        return (
            <div style={[csx.vertical,shownStyle]}>
                <div style={[csx.horizontal,shownStyle]}>
                    <div style={[csx.flex, csx.vertical]}>
                        <div style={[csx.horizontal, csx.center, styles.padded1]}>
                            <input tabIndex={1} ref="find" placeholder="Find" style={[inputBlackStyle, inputCodeStyle, csx.flex]} onKeyDown={this.findKeyDownHandler} onChange={this.findChanged} defaultValue={this.props.findQuery.query}/>
                        </div>
                        <div style={[csx.horizontal, csx.center, styles.padded1]}>
                            <input tabIndex={2} ref="replace" placeholder="Replace" style={[inputBlackStyle, inputCodeStyle, csx.flex]} onKeyDown={this.replaceKeyDownHandler} />
                        </div>
                    </div>
                    <div style={[csx.centerCenter]}>
                        <div style={[csx.horizontal, csx.aroundJustified, styles.padded1]}>
                            <label style={[csx.horizontal,csx.center]}><ui.Toggle tabIndex={3} ref="regex" onChange={this.handleRegexChange}/><span style={searchOptionsLabelStyle}>.*</span></label>
                            <label style={[csx.horizontal,csx.center]}><ui.Toggle tabIndex={4} ref="caseInsensitive" onChange={this.handleCaseSensitiveChange}/><span style={searchOptionsLabelStyle}>Aa</span></label>
                            <label style={[csx.horizontal,csx.center]}><ui.Toggle tabIndex={5} ref="fullWord" onKeyDown={this.fullWordKeyDownHandler} onChange={this.handleFullWordChange}/><span style={searchOptionsLabelStyle}><Icon name="text-width"/></span></label>
                        </div>
                    </div>
                </div>
                <div style={[tipMessageStyle,styles.padded1]}>
                    <span style={keyboardShortCutStyle}>Esc</span> to exit
                    {' '}<span style={keyboardShortCutStyle}>Enter</span> to find next
                    {' '}<span style={keyboardShortCutStyle}>Shift + Enter</span> to find previous
                    {' '}<span style={keyboardShortCutStyle}>{ui.modName} + Enter</span> to replace
                    {' '}<span style={keyboardShortCutStyle}>Shift + {ui.modName} + Enter</span> to replace all
                </div>
            </div>
        );
    }

    /** Tab key is only called on key down :) */
    findKeyDownHandler = (e:React.SyntheticEvent) => {
        let {tab,shift,enter} = ui.getKeyStates(e);

        if (shift && tab) {
            this.fullWordInput().focus();
            e.preventDefault();
            return;
        }

        this.handleSearchKeys(e);
    };

    replaceKeyDownHandler = (e:React.SyntheticEvent) => {
        this.handleSearchKeys(e);
    };

    fullWordKeyDownHandler = (e:React.SyntheticEvent) => {
        let {tab,shift,enter} = ui.getKeyStates(e);

        if (tab && !shift) {
            this.findInput().focus();
            e.preventDefault();
            return;
        }
    };

    handleSearchKeys(e: React.SyntheticEvent) {
        let {tab,shift,enter,mod} = ui.getKeyStates(e);

        if (!state.getState().findOptions.query){
            return;
        }

        if (mod && shift && enter) {
            commands.replaceAll.emit({newText:this.replaceWith()});
            return;
        }

        if (mod && enter) {
            commands.replaceNext.emit({newText:this.replaceWith()});
            return;
        }

        if (shift && enter) {
            commands.findPrevious.emit({});
            return;
        }

        if (enter) {
            commands.findNext.emit({});
            return;
        }
    }

    findChanged = utils.debounce(() => {
        let val = this.findInput().value;
        state.setFindOptionsQuery(val)
    },200);

    handleRegexChange = (e) => {
        let val: boolean = e.target.checked;
        state.setFindOptionsIsRegex(val);
    }
    handleCaseSensitiveChange = (e) => {
        let val: boolean = e.target.checked;
        state.setFindOptionsIsCaseSensitive(val);
    }
    handleFullWordChange = (e) => {
        let val: boolean = e.target.checked;
        state.setFindOptionsIsFullWord(val);
    }
}
