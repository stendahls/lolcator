import { useMemo, useState, useRef, useEffect } from 'react';

import removeAccents from 'remove-accents';

import './App.css';
import loading from './loading.gif';
import baby from './baby.gif';
import coin from './coin.jpg';
import coinsound from './coin.mp3';
import empty from './empty.webp';
import mushroom from './mushroom.png';

import Rooms from './components/Rooms';
import Peeps from './components/Peeps';

const UNICATOR_HOST = 'https://unicator.stendahls.dev';

// Only show people that have been on for less than 12 hours
const MAX_AVAILABLE_TIME = 12 * 60 * 60;

const timeout = function timeout( ms, promise ) {
    return new Promise( ( resolve, reject ) => {
        setTimeout( () => {
            reject( new Error( 'FETCH_TIMEOUT' ) );
        }, ms );

        promise.then( resolve, reject );
    } );
};

const normaliseIdentifier = ( identifier ) => {
    return removeAccents( identifier.toLowerCase().replace( /[.-]/g, ' ' ) );
};

const App = function App() {
    const [filter, setFilter] = useState( '' );
    const [bookingsToday, setBookingsToday] = useState( [] );
    const [uniqueUsers, setUniqueUsers] = useState(0);
    const [onPremise, setOnPremise] = useState(true);
    const [view, setView] = useState(window.location.pathname === '/rooms' ? 'rooms' : 'peeps');
    const [urlParams] = useState(new URLSearchParams( window.location.search ))
    const [allDevices, setAllDevices] = useState([]);
    const filterInput = useRef( null );
    const coinButton = useRef( null );
    const coinPlayer = useRef( null );
    const [randomPeep, setRandomPeep] = useState( false );
    const mushroomButton = useRef( null );
    const [isLoading, setIsLoading] = useState(false);

    const handleFilterChange = ( event ) => {
        setFilter(normaliseIdentifier( event.target.value ));
        setRandomPeep(false);
    };

    const validDevices = useMemo(() => {
        let allValidDevices = allDevices.filter( ( device ) => {
            if ( normaliseIdentifier( device.identity ).includes( filter ) ) {
                return true;
            }

            if ( device.ap.location.indexOf( filter ) === 0 ) {
                return true;
            }

            return false;
        } );

        if(randomPeep){
            allValidDevices = allValidDevices.slice(randomPeep, randomPeep + 1);
        }

        return allValidDevices;
    }, [filter, allDevices, randomPeep]);

    const handleCoinClick = () => {
        coinButton.current.classList.add('coin-clicked');
        coinPlayer.current.play();

        setRandomPeep(Math.floor(Math.random() * Math.floor(allDevices.length)));
        setView('peeps');
        window.history.pushState(null, null, '/');

        setTimeout( () => {
            coinButton.current.classList.remove('coin-clicked');
        }, 200 );
    }

    const handleTitleClick = () => {
        setView('peeps');
        window.history.pushState(null, null, '/');
        setFilter('');
        setRandomPeep(false);
    };

    const handleMushroomClick = () => {
        mushroomButton.current.classList.add('mushroom-clicked');
        setView('rooms');
        window.history.pushState(null, null, '/rooms');

        setTimeout( () => {
            mushroomButton.current.classList.remove('mushroom-clicked');
        }, 200 );
    };

    const updateData = () => {
        setIsLoading(true);
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
            const actualDevices = {};

            const devices = response.data.devices
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

            devices.map( ( device ) => {
                if ( !actualDevices[ device.identity ] ) {
                    actualDevices[ device.identity ] = device;

                    return false;
                }

                if ( actualDevices[ device.identity ].firstSeen < device.firstSeen ) {
                    actualDevices[ device.identity ] = device;

                    return true;
                }

                return true;
            } );

            devices.map( ( device ) => {
                if ( !actualDevices[ device.identity ] ) {
                    actualDevices[ device.identity ] = device;

                    return false;
                }

                if ( actualDevices[ device.identity ].firstSeen < device.firstSeen ) {
                    actualDevices[ device.identity ] = device;

                    return true;
                }

                return true;
            } );

            setAllDevices(Object.values( actualDevices ));

            const logins = Object.values( actualDevices ).map( ( device ) => {
                return device.identity;
            } );

            setUniqueUsers([ ...logins.filter((v, i, a) => a.indexOf(v) === i) ].length);
            setIsLoading(false);

            document.querySelector( '.App' ).classList.add( 'loaded' );
        } )
        .catch( ( fetchError  ) => {
            if ( fetchError.message === 'FETCH_TIMEOUT' ) {
                setIsLoading(false);
                setOnPremise( false );
            }
        } );
    }

    const updateRoomData = () => {
        timeout( 5000,
            fetch( `${ UNICATOR_HOST }/graphql`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify( { query: `{
                        bookingsToday {
                            identifier
                            displayName
                            bookings {
                                end
                                organizer
                                start
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
            setBookingsToday(response.data.bookingsToday);
        } )
        .catch( ( fetchError  ) => {
            if ( fetchError.message === 'FETCH_TIMEOUT' ) {
                setOnPremise(false);
            }
        } );
    };

    useEffect(() => {
        (async () => {
            updateData();
            updateRoomData();
        })();

        const updateInterval = setInterval( () => {
            updateData();
            updateRoomData();
        }, 60000 );

        return () => {
            clearInterval( updateInterval );
        };
    },[]);

    const getRendering = () => {
        if ( !onPremise ) {
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
            </div>
        }

        return <Peeps
            validDevices = {validDevices}
            urlParams = {urlParams}
        />
    };

    const matchingRooms = useMemo( () => {
        return bookingsToday.filter((room) => {
            if(normaliseIdentifier(room.displayName).includes(normaliseIdentifier(filter))){
                return true;
            }

            if(room.identifier.toLowerCase().includes(filter.toLocaleLowerCase())){
                return true;
            }

            return false;
        });
    },[bookingsToday, filter]);

    return (
        <div className="App">
            <header className="App-header">
                <img
                    alt = 'Hitta ett konferensrum'
                    className = 'mushroom'
                    onClick = { handleMushroomClick }
                    title = 'Hitta ett konferensrum'
                    src = { mushroom }
                    ref = { mushroomButton }
                />
                <img
                    alt = 'Slumpa fram en stendarling'
                    className = 'coin'
                    onClick = { handleCoinClick }
                    title = 'Slumpa fram en stendarling'
                    src = { coin }
                    ref = { coinButton }
                />
                <audio
                    controls=""
                    ref = { coinPlayer }
                >
                    <source
                        src = { coinsound }
                        type = 'audio/mpeg'
                    />
                </audio>
                <h1
                    onClick = { handleTitleClick }
                    title = { `Just nu är det ungefär ${ uniqueUsers } stendarlings i huset` }
                >
                    { 'L0LC4tor' }
                </h1>
                <input
                    type = { 'search' }
                    value = { filter }
                    onChange = { handleFilterChange }
                    placeholder = { 'Hitta...' }
                    aria-label = { 'Hitta...' }
                    ref = { filterInput }
                />
                <a
                    href = "slack://user?team=T034ZQLT0&id=U02CRLC7A5C"
                    className = "remove-link"
                >
                    Jag vill inte synas här!
                </a>
            </header>
            <div
                className='message-wrapper'
            >
                {isLoading && allDevices.length === 0 && <img
                    alt = { 'Loading data' }
                    src = { loading }
                />}
                {!isLoading && view !== 'rooms' && validDevices.length === 0 && <img
                    alt = { 'Nothing here' }
                    src = { empty }
                /> }
            </div>
            {view === 'rooms' && <Rooms bookingsToday={matchingRooms}/>}
            {view !== 'rooms'&& <div
                className = { 'devices-wrapper' }
            >
                { getRendering() }
            </div>}
        </div>
    );
}

export default App;
