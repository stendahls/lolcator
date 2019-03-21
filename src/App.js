import React, { Component } from 'react';
import crypto from 'crypto';
import TimeAgo from 'react-timeago';
import './App.css';

const UNICATOR_HOST = '172.20.30.31';
// const UNICATOR_HOST = 'localhost:4000';


class App extends Component {
    constructor(){
        super();

        this.state = {
            filter: '',
            devices: [],
            uniqueUsers: 0,
        };

        this.handleFilterChange = this.handleFilterChange.bind( this );
    }

    handleFilterChange( event ) {
        this.setState( {
            filter: event.target.value,
        } );
    }

    updateData () {
        fetch( `http://${ UNICATOR_HOST }/graphql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( { query: `{
              devices {
                identity
                lastSeen
                hostname
                mac
                isPersonal
                ap {
                  name
                  location
                }
              }
            }` } ),
        } )
        .then( ( response ) => {
            return response.json();
        } )
        .then( ( response ) => {
            const newState = {
                devices: response.data.devices
                .filter( ( device ) => {
                    return device.isPersonal;
                } )
                .sort( ( a, b ) => {
                    return a.identity.localeCompare( b.identity );
                } ),
            };

            const logins = newState.devices.map( ( device ) => {
                return device.identity;
            } );

            newState.uniqueUsers = [ ...new Set( logins ) ].length;

            this.setState( newState )
        } );
    }

    componentDidMount(){
        this.updateData();

        setInterval( () => {
            this.updateData();
        }, 60000 );
    }

    getMatchingDevices () {
        return this.state.devices.filter( ( device ) => {
            if ( device.identity.includes( this.state.filter ) ) {
                return true;
            }

            if ( device.ap.location.indexOf( this.state.filter ) === 0 ) {
                return true;
            }

            return false;
        } )
        .map( ( device ) => {
            return <div
                className = { 'device-wrapper' }
                key = { device.mac }
            >
                { device.identity }
                <div
                    className = { 'last-seen-wrapper' }
                >
                    <img
                        alt = { device.identity }
                        src = { `http://avatars.stendahls.net/avatar/${ crypto.createHash( 'md5' ).update( `${ device.identity }@stendahls.se` ).digest( 'hex' ) }` }
                    />
                    <div
                        className = { 'location-wrapper' }
                    >
                        { device.hostname }
                    </div>
                    <div
                        className = { 'location-wrapper' }
                    >
                        { 'Room '}
                        { device.ap.location }
                        <div>
                            { device.mac }
                        </div>
                    </div>
                    <TimeAgo
                        date = { device.lastSeen * 1000 }
                    />
                </div>
            </div>;
        } )
        ;
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <h1>
                        { 'LoLCator' }
                        { ` ${ this.state.uniqueUsers }` }
                    </h1>
                    <input
                        type = { 'text' }
                        value = { this.state.filter }
                        onChange = { this.handleFilterChange }
                        placeholder = { 'Find...' }
                    />
                </header>
                <div
                    className = { 'devices-wrapper' }
                >
                    { this.getMatchingDevices() }
                </div>
            </div>
        );
    }
}

export default App;
