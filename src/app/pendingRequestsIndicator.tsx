import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import {connect} from "react-redux";
import * as ui from "./ui";
import * as state from "./state/state";

export interface Props extends React.Props<any> {
    pendingRequests?: string[];
}
export interface State {

}

require('./pendingRequestsIndicator.css');

@connect((state: state.StoreState): Props => {
    return {
        pendingRequests: state.pendingRequests,
    };
})
export class PendingRequestsIndicator extends BaseComponent<Props, State>{
    componentWillReceiveProps(){
    }
    render(){
        let pendingRequestsCount = this.props.pendingRequests.length;
        let style = {
            opacity: pendingRequestsCount?1:0,
            transition: 'opacity .5s',
            cursor: 'pointer'
        };
        let pendingRequestCountStyle = {
            fontSize: '7px',
            paddingRight: '2px',
            color: '#2776b7'
        };
        return (
            <span style={style} onClick={()=>console.log(this.props.pendingRequests)}>
                <span style={pendingRequestCountStyle}>{pendingRequestsCount}</span>
                <span className="loader">
                    <ul>
                        <li className="one" />
                        <li className="two" />
                        <li className="three" />
                        <li className="four" />
                        <li className="five" />
                    </ul>
                </span>
            </span>
        );
    }
}
