import crypto from 'crypto';

import React, { Component } from 'react';
import TimeAgo from 'react-timeago';
import removeAccents from 'remove-accents';

import './App.css';
import loading from './loading.gif';
import baby from './baby.gif';

const UNICATOR_HOST = 'https://unicator.stendahls.dev';
const LIBRAVATAR_SERVER = 'https://libravatar.stendahls.dev';
const DEFAULT_IMAGES = [
    'https://images.weserv.nl/?url=www.stendahls.se/app/uploads/2017/09/PLACEHOLDER_01.jpg&w=512&h=512&t=square&a=center',
    'https://images.weserv.nl/?url=www.stendahls.se/app/uploads/2014/09/PLACEHOLDER_02.jpg&w=512&h=512&t=square&a=center',
];

// Only show people that have been on for less than 12 hours
const MAX_AVAILABLE_TIME = 12 * 60 * 60;

const getRandomDefaultImageURL = function getRandomDefaultImageURL(){
    return DEFAULT_IMAGES[ Math.floor( Math.random() * DEFAULT_IMAGES.length ) ];
};

const timeout = function timeout( ms, promise ) {
    return new Promise( ( resolve, reject ) => {
        setTimeout( () => {
            reject( new Error( 'FETCH_TIMEOUT' ) );
        }, ms );

        promise.then( resolve, reject );
    } );
};

class App extends Component {
    constructor(){
        super();

        this.state = {
            filter: '',
            devices: [],
            uniqueUsers: 0,
            onPremise: true,
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
        timeout( 5000,
            fetch( `${ UNICATOR_HOST }/graphql`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify( { query: `{
                      devices {
                        identity
                        firstSeen
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
                }
            )
        )
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
                .filter( ( device ) => {
                    return new Date().getTime() / 1000 - device.firstSeen < MAX_AVAILABLE_TIME;
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
        } )
        .catch( ( fetchError  ) => {
            if ( fetchError.message === 'FETCH_TIMEOUT' ) {
                this.setState( {
                    onPremise: false,
                } );
            }
        } );
    }

    componentDidMount(){
        this.filterInput.focus();
        this.updateData();

        setInterval( () => {
            this.updateData();
        }, 60000 );
    }

    normaliseIdentifier( identifier ) {
        return removeAccents( identifier.toLowerCase().replace( /[.-]/g, ' ' ) );
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

        const actualDevices = {};

        this.state.devices.map( ( device ) => {
            if ( !actualDevices[ device.identity ] ) {
                actualDevices[ device.identity ] = device;

                return true;
            }

            if ( actualDevices[ device.identity ].firstSeen < device.firstSeen ) {
                actualDevices[ device.identity ] = device;

                return true;
            }
        } );

        const normalisedFilter = this.normaliseIdentifier( this.state.filter );

        return Object.values( actualDevices ).filter( ( device ) => {
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
                        title = { device.identity }
                        src = { `${ LIBRAVATAR_SERVER }/avatar/${ crypto.createHash( 'md5' ).update( `${ device.identity }@stendahls.se` ).digest( 'hex' ) }?s=512&default=${ encodeURIComponent( getRandomDefaultImageURL() ) }` }
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
                            { 'Rum '}
                            { device.ap.location }
                        </a>
                        { this.urlParams.get( 'debug' ) &&
                            <div>
                                { device.mac }
                            </div>
                        }
                    </div>
                    { this.urlParams.get( 'debug' ) &&
                        <TimeAgo
                            date = { device.lastSeen * 1000 }
                        />
                    }
                </div>
            </div> );
        } )
        ;
    }

    getRendering(){
        if ( this.state.onPremise ) {
            return this.getMatchingDevices();
        }

        return <div
            className = { 'offline' }
        >
            <p>
                { 'Du måste vara inne på Stendahls hörru!' }
            </p>
            <img
                alt = { 'Offline' }
                src = { baby }
            />
            <p>
                { 'Kom in, ta en fika och försök igen <3' }
            </p>
        </div>;
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
                        ref = { ( input ) => {
                            this.filterInput = input;
                        } }
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

                    { this.getRendering() }
                </div>
            </div>
        );
    }
}

export default App;
