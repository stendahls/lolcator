import md5 from 'crypto-js/md5';
import TimeAgo from 'react-timeago';

import formatName from '../modules/format-name';

const LIBRAVATAR_SERVER = 'https://libravatar.stendahls.dev';

const DEFAULT_IMAGES = [
    'https://images.weserv.nl/?url=www.stendahls.se/wp-content/uploads/2020/03/PLACEHOLDER_01.jpg&w=512&h=512&t=square&a=center',
    'https://images.weserv.nl/?url=www.stendahls.se/wp-content/uploads/2020/03/PLACEHOLDER_02.jpg&w=512&h=512&t=square&a=center',
    'https://images.weserv.nl/?url=www.stendahls.se/wp-content/uploads/2020/03/PLACEHOLDER_03.jpg&w=512&h=512&t=square&a=center',
];

const getRandomDefaultImageURL = function getRandomDefaultImageURL(){
    return DEFAULT_IMAGES[ Math.floor( Math.random() * DEFAULT_IMAGES.length ) ];
};

const Peeps = function({validDevices, urlParams}){
    return validDevices.map( ( device ) => {
        return ( <div
            className = { 'device-wrapper' }
            title = { device.identity }
            key = { device.mac }
        >
            { formatName( device.identity ) }
            <div
                className = { 'last-seen-wrapper' }
            >
                <img
                    alt = { device.identity }
                    src = { `${ LIBRAVATAR_SERVER }/avatar/${ md5( `${ device.identity }@stendahls.se` ) }?s=512&default=${ encodeURIComponent( getRandomDefaultImageURL() ) }` }
                />
                { urlParams.get( 'debug' ) &&
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
                        href={`https://intranet.stendahls.dev/praktisk-information/vad-finns-var/kartor/?vaning=${device.ap.location.substring(0, 1)}&typ=vaningar`}
                        title="Tack Felicia! Bra idé"
                    >
                        { 'Rum '}
                        { device.ap.location }
                    </a>
                    { urlParams.get( 'debug' ) &&
                        <div>
                            { device.mac }
                        </div>
                    }
                </div>
                { urlParams.get( 'debug' ) &&
                    <TimeAgo
                        date = { device.lastSeen * 1000 }
                    />
                }
            </div>
        </div> );
    } );
}

export default Peeps;
