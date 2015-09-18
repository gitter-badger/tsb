import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";
// import {DashboardTab} from "./dashboardTab";
import {Code} from "./codeTab";
import * as commands from "../commands/commands";
import csx = require('csx');

import {tabHeaderContainer,tabHeader,tabHeaderActive,tabHeaderUnsaved} from "../styles/styles";

import {server} from "../../socket/socketClient";
import {rangeLimited} from "../../common/utils";

export interface Props extends React.Props<any> {

}

export interface State {
    selected?: number;
    tabs?: tab.TabInstance[];
}

@ui.Radium
export class AppTabsContainer extends ui.BaseComponent<Props, State>{

    constructor(props: Props) {
        super(props);

        this.state = {
            selected: 0,
            tabs: []
        };
        
        this.setupDemoTab();
    }

    refs: { [string: string]: tab.Component; }
    
    /** For Demo only */
    setupDemoTab(){
        server.makeAbsolute({ relativeFilePath: 'node_modules/ntypescript/src/compiler/checker.ts' }).then(abs => {
            commands.onOpenFile.emit({ filePath: abs.filePath });
        });
        server.makeAbsolute({ relativeFilePath: 'src/app/root.tsx'}).then(abs => {
            commands.onOpenFile.emit({ filePath: abs.filePath });
        });
        server.makeAbsolute({ relativeFilePath: 'src/app/root.js'}).then(abs => {
            commands.onOpenFile.emit({ filePath: abs.filePath });
        });
        server.makeAbsolute({ relativeFilePath: 'src/bas.ts'}).then(abs => {
            commands.onOpenFile.emit({ filePath: abs.filePath });
        });
    }

    componentDidMount() {
        commands.nextTab.on(() => {
            let selected = rangeLimited({ min: 0, max: this.state.tabs.length - 1, num: ++this.state.selected, loopAround: true });
            this.selectTab(selected);
        });
        commands.prevTab.on(() => {
            let selected = rangeLimited({ min: 0, max: this.state.tabs.length - 1, num: --this.state.selected, loopAround: true });
            this.selectTab(selected);
        });
        
        commands.onOpenFile.on((e) =>{
            let codeTab: tab.TabInstance = {
                ref: null,
                url: `file://${e.filePath}`,
                title: `${getFileName(e.filePath)}`,
                saved: true
            }
            
            this.state.tabs.push(codeTab);
            this.setState({ tabs: this.state.tabs });
            this.onTabClicked(this.state.tabs.length - 1);
        });
        
        commands.onCloseTab.on((e)=>{
            // If no tabs
            if (!this.state.tabs.length) {
                return;
            }
            
            // Remove the selected
            let selected = this.state.selected;
            this.state.tabs.splice(selected, 1);
            this.setState({ tabs: this.state.tabs });
            
            // Figure out the next:
            // Nothing to do
            if (!this.state.tabs.length) {
                return;
            }
            // Previous
            let next = rangeLimited({num:--selected,min:0,max:this.state.tabs.length});
            this.selectTab(next);
        });
        
        commands.onSaveTab.on((e) => {
            let component = this.getSelectedComponent();
            if (component) {
                component.save();
            }
        });
    }

    render() {
        
        let selectedIndex = this.state.selected;
        
        let titles = this.state.tabs.map((t, i) =>{
            let title = t.title;
            var style = [tabHeader.base, i == selectedIndex ? tabHeaderActive : {}];
            if (!t.saved){
                style.push(tabHeaderUnsaved);
            }
            return <span
                key={`tabHeader ${i}`}
                style={style}
                onClick={()=>this.onTabClicked(i)}>
                {title}
            </span>
        });
        
        let rederedTabs = this.state.tabs.map((t,i)=>{
            let isSelected = selectedIndex == i;
            let style = ( isSelected ? {} : { display: 'none' });

            let Component = getComponentByUrl(t.url);
            
            return <div key={i} style={[style,csx.flex]}>
                <Component ref={tab.getRef({url:t.url,index:i})} url={t.url} onSavedChanged={(saved)=>{this.onSavedChanged(saved,i)}}/>
            </div>
        });
        
        return (
            <div style={[csx.vertical,csx.flex]} className="app-tabs">
                <div style={[csx.horizontal, tabHeaderContainer]} className="app-tabs-header">
                    {titles}
                </div>
                <div style={[csx.flexRoot, csx.flex, csx.scroll]} className="app-tabs-body">
                    {rederedTabs}
                </div>
            </div>
        );
    }
    
    onTabClicked = (index) => {
        this.setState({ selected: index });
        this.selectTab(index);
    }

    onSavedChanged = (saved: boolean, index: number) => {
        let state = this.state;
        state.tabs[index].saved = saved;
        this.setState({ tabs: state.tabs });
    }
    
    private selectTab(selected: number) {
        /** Set timeout to allow the next tab to render */
        setTimeout(() => {
            // cant select what aint there
            if (this.state.tabs.length == 0) {
                return;
            }
            
            this.setState({ selected: selected });
            this.state.selected = selected;            
            let component = this.getSelectedComponent();
            if (component) {
                component.focus();
            }
        });
    }
    
    getSelectedComponent(): tab.Component {
        let selected =this.state.selected;
        let ref = tab.getRef({url:this.state.tabs[selected].url, index:selected});
        let component = this.refs[ref];
        return component;
    }
}


export function getFileName(filePath:string){
    let parts = filePath.split('/');
    return parts[parts.length - 1];
}

/** TODO: implement other protocol tabs */
export function getComponentByUrl(url:string) {
    return Code;
}