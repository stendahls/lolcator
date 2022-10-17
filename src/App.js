import md5 from 'crypto-js/md5';

import React, { Component } from 'react';
import TimeAgo from 'react-timeago';
import removeAccents from 'remove-accents';

import './App.css';
import loading from './loading.gif';
import baby from './baby.gif';
import coin from './coin.jpg';
import coinsound from './coin.mp3';
import empty from './empty.webp';

const UNICATOR_HOST = 'https://unicator.stendahls.dev';
const LIBRAVATAR_SERVER = 'https://libravatar.stendahls.dev';
const DEFAULT_IMAGES = [
    'https://images.weserv.nl/?url=www.stendahls.se/wp-content/uploads/2020/03/PLACEHOLDER_01.jpg&w=512&h=512&t=square&a=center',
    'https://images.weserv.nl/?url=www.stendahls.se/wp-content/uploads/2020/03/PLACEHOLDER_02.jpg&w=512&h=512&t=square&a=center',
    'https://images.weserv.nl/?url=www.stendahls.se/wp-content/uploads/2020/03/PLACEHOLDER_03.jpg&w=512&h=512&t=square&a=center',
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
        this.handleCoinClick = this.handleCoinClick.bind( this );
        this.handleTitleClick = this.handleTitleClick.bind( this );

        this.urlParams = new URLSearchParams( window.location.search );
    }

    handleFilterChange( event ) {
        const normalisedFilter = this.normaliseIdentifier( event.target.value );

        const devices = this.state.validDevices.filter( ( device ) => {
            if ( this.normaliseIdentifier( device.identity ).includes( normalisedFilter ) ) {
                return true;
            }

            if ( device.ap.location.indexOf( event.target.value ) === 0 ) {
                return true;
            }

            return false;
        } );


        this.setState( {
            filter: event.target.value,
            devices: devices,
        } );
    }

    handleCoinClick( event ) {
        this.coinButton.classList.add('coin-clicked');
        this.coinPlayer.play();

        const randomIndex = Math.floor(Math.random() * Math.floor(this.state.validDevices.length));

        this.setState( {
            devices: this.state.validDevices.slice(randomIndex, randomIndex + 1),
            filter: '',
        } );

        setTimeout( () => {
            this.coinButton.classList.remove('coin-clicked');
        }, 200 );
    }

    handleTitleClick() {
        this.setState( {
            devices: this.state.validDevices,
            filter: '',
        } );
    }

    updateData () {
        timeout( 5000,
            fetch( `${ UNICATOR_HOST }/graphql`,
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
            const newState = {};
            const actualDevices = {};

            const validDevices = response.data.devices
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
                    } );

            validDevices.map( ( device ) => {
                if ( !actualDevices[ device.identity ] ) {
                    actualDevices[ device.identity ] = device;

                    return true;
                }

                if ( actualDevices[ device.identity ].firstSeen < device.firstSeen ) {
                    actualDevices[ device.identity ] = device;

                    return true;
                }

                return true;
            } );

            newState.validDevices = Object.values( actualDevices );

            const logins = newState.validDevices.map( ( device ) => {
                return device.identity;
            } );

            newState.uniqueUsers = [ ...logins.filter((v, i, a) => a.indexOf(v) === i) ].length;

            if ( this.state.devices.length === 0 && !this.state.filter ) {
                newState.devices = newState.validDevices;
            }

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
        return identifier.split( '.' )[ 0 ]
        .replace('asa', 'åsa')
        .replace('goran', 'göran')
        .replace('hakan', 'håkan')
        .replace('lars-hakan', 'lars-håkan')
        .replace('soren', 'sören');
    }

    getMatchingDevices () {
        if ( this.state.validDevices?.length === 0 ) {
            return ( <img
                alt = { 'Loading data' }
                src = { loading }
            /> );
        }

        if ( this.state.devices.length === 0 ) {
            return ( <img
                alt = { 'Nothing here' }
                src = { empty }
            /> );
        }

        return this.state.devices.map( ( device ) => {
            return ( <div
                className = { 'device-wrapper' }
                title = { device.identity }
                key = { device.mac }
            >
                { this.formatName( device.identity ) }
                <div
                    className = { 'last-seen-wrapper' }
                >
                    <img
                        alt = { device.identity }
                        src = { `${ LIBRAVATAR_SERVER }/avatar/${ md5( `${ device.identity }@stendahls.se` ) }?s=512&default=${ encodeURIComponent( getRandomDefaultImageURL() ) }` }
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

                        <a
                            href="https://intranet.stendahls.dev/hr-praktisk-information/vad-finns-var/kartor/"
                            title="Tack Felicia! Bra idé"
                        >
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
        } );
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
                    <img
                        alt = 'Slumpa fram en stendarling'
                        className = 'coin'
                        onClick = { this.handleCoinClick }
                        title = 'Slumpa fram en stendarling'
                        src = { coin }
                        ref = { ( img ) => {
                            this.coinButton = img;
                        } }
                    />
                    <audio
                        controls=""
                        ref = { ( player ) => {
                            this.coinPlayer = player;
                        } }
                    >
                        <source
                            src = { coinsound }
                            type = 'audio/mpeg'
                        />
                    </audio>
                    <h1
                        onClick = { this.handleTitleClick }
                        title = { `Just nu är det ungefär ${ this.state.uniqueUsers } stendarlings i huset` }
                    >
                        { 'L0LC4tor' }
                    </h1>
                    <input
                        type = { 'search' }
                        value = { this.state.filter }
                        onChange = { this.handleFilterChange }
                        placeholder = { 'Hitta...' }
                        aria-label = { 'Hitta...' }
                        ref = { ( input ) => {
                            this.filterInput = input;
                        } }
                    />
                    <a
                        href = "slack://user?team=T034ZQLT0&id=U02CRLC7A5C"
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
