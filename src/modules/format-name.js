module.exports = ( identifier ) => {
    return identifier.split( '.' )[ 0 ]
        .replace('asa', 'åsa')
        .replace('goran', 'göran')
        .replace('hakan', 'håkan')
        .replace('lars-hakan', 'lars-håkan')
        .replace('soren', 'sören')
        .replace('host/', '');
};
