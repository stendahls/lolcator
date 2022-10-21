import md5 from 'crypto-js/md5.js'

const LIBRAVATAR_SERVER = 'https://libravatar.stendahls.dev';

const DEFAULT_IMAGES = [
    'https://images.weserv.nl/?url=www.stendahls.se/wp-content/uploads/2020/03/PLACEHOLDER_01.jpg&w=512&h=512&t=square&a=center',
    'https://images.weserv.nl/?url=www.stendahls.se/wp-content/uploads/2020/03/PLACEHOLDER_02.jpg&w=512&h=512&t=square&a=center',
    'https://images.weserv.nl/?url=www.stendahls.se/wp-content/uploads/2020/03/PLACEHOLDER_03.jpg&w=512&h=512&t=square&a=center',
];

const getRandomDefaultImageURL = function getRandomDefaultImageURL(){
    return DEFAULT_IMAGES[ Math.floor( Math.random() * DEFAULT_IMAGES.length ) ];
};

const libravatarImage = (email, size = 512) => {
    return `${ LIBRAVATAR_SERVER }/avatar/${ md5( email ) }?s=${size}&default=${ encodeURIComponent( getRandomDefaultImageURL() ) }`;
};

export default libravatarImage;
