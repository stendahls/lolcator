import TimeAgo from 'react-timeago';

import formatName from '../modules/format-name';
import libravatarImage from '../modules/libravatar-image.mjs';

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
                    src = { libravatarImage(`${ device.identity }@stendahls.se`) }
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
