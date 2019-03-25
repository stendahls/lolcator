import React, { Component } from 'react';
import crypto from 'crypto';
import TimeAgo from 'react-timeago';
import './App.css';
import loading from './loading.gif';

// const UNICATOR_HOST = 'localhost:4000';
const UNICATOR_HOST = 'https://unicator.stendahls.se';


class App extends Component {
    constructor(){
        super();

        this.state = {
            filter: '',
            devices: [],
            uniqueUsers: 0,
        };

        this.handleFilterChange = this.handleFilterChange.bind( this );

        this.urlParams = new URLSearchParams( window.location.search );
    }

    handleFilterChange( event ) {
        this.setState( {
            filter: event.target.value,
        } );
    }

    updateData () {
        fetch( `${ UNICATOR_HOST }/graphql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify( { query: `{
              devices {
                identity
                lastSeen
                hostname
                mac
                isPersonal
                locator
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
                .filter( ( device ) => {
                    return device.locator;
                } )
                .sort( ( a, b ) => {
                    return a.identity.localeCompare( b.identity );
                } ),
            };

            const logins = newState.devices.map( ( device ) => {
                return device.identity;
            } );

            newState.uniqueUsers = [ ...new Set( logins ) ].length;

            this.setState( newState );

            document.querySelector( '.App' ).classList.add( 'loaded' );
        } );
    }

    componentDidMount(){
        this.updateData();

        setInterval( () => {
            this.updateData();
        }, 60000 );
    }

    normaliseIdentifier( identifier ) {
        return identifier.toLowerCase().replace( /[.-]/g, ' ' );
    }

    formatName( identifier ) {
        return identifier.split( '.' )[ 0 ];
    }

    getMatchingDevices () {
        if ( this.state.devices.length === 0 ) {
            return ( <img
                alt = { 'Loading data' }
                src = { loading }
            /> );
        }

        const normalisedFilter = this.normaliseIdentifier( this.state.filter );

        return this.state.devices.filter( ( device ) => {
            if ( this.normaliseIdentifier( device.identity ).includes( normalisedFilter ) ) {
                return true;
            }

            if ( device.ap.location.indexOf( this.state.filter ) === 0 ) {
                return true;
            }

            return false;
        } )
        .map( ( device ) => {
            return ( <div
                className = { 'device-wrapper' }
                key = { device.mac }
            >
                { this.formatName( device.identity ) }
                <div
                    className = { 'last-seen-wrapper' }
                >
                    <img
                        alt = { device.identity }
                        src = { `https://avatars.stendahls.net/avatar/${ crypto.createHash( 'md5' ).update( `${ device.identity }@stendahls.se` ).digest( 'hex' ) }` }
                    />
                    { this.urlParams.get( 'debug' ) &&
                        <div
                            className = { 'location-wrapper' }
                        >
                            { device.hostname }
                        </div>
                    }
                    <div
                        className = { 'location-wrapper' }
                    >

                        <a href="http://intranet.stendahls.se/sv/mitt-arbete/Min-arbetsplats/Vad-finns-var/Karta/" title="Tack Felicia! Bra idé">
                            { 'Room '}
                            { device.ap.location }
                        </a>
                        { this.urlParams.get( 'debug' ) &&
                            <div>
                                { device.mac }
                            </div>
                        }
                    </div>
                    <TimeAgo
                        date = { device.lastSeen * 1000 }
                    />
                </div>
            </div> );
        } )
        ;
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <h1
                        title = { `Just nu är det ungefär ${ this.state.uniqueUsers } stendarlings i huset` }
                    >
                        { 'L0LC4tor' }
                    </h1>
                    <input
                        type = { 'text' }
                        value = { this.state.filter }
                        onChange = { this.handleFilterChange }
                        placeholder = { 'Hitta...' }
                    />
                    <a
                        href = "slack://user?team=T02FRPWEC&id=U6QK0T8MN"
                        className = "remove-link"
                    >
                        Jag vill inte synas här!
                    </a>
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
