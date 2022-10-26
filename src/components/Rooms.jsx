const dayDuration = 8.5 * 60 * 60 * 1000;

const listOfRooms = [
    '410-1',
];

function Rooms ({bookingsToday: rooms}) {
    const startOfToday = new Date().setHours(8, 30, 0, 0);

    const rightNowPosition = (new Date().getTime() - startOfToday) / dayDuration * 100;
    return (
        <div
            className = "rooms"
        >
            <div
                className = "right-now-line"
                style = {{
                    left: `${Math.min(Math.max(rightNowPosition, 0), 100)}%`,
                }}
            />
            <div
                className = "workspaces-wrapper"
            >
                {listOfRooms.map((room) => {
                    return <div
                        className="workspace"
                        key = {`workspace-${room}`}
                    />;
                })}
            </div>
            {rooms.map(room => {
                return <div
                    key = {room.identifier}
                >
                    <h2>
                        <a
                            href = {`https://intranet.stendahls.dev/praktisk-information/vad-finns-var/kartor/?vaning=${room.identifier.substring(0, 1)}&typ=motesrum`}
                        >
                            {room.displayName} - {room.identifier.substring(0, 3)}
                        </a>
                    </h2>
                    <div
                        className = "room-wrapper"
                    >
                    {room.bookings.map(booking => {

                        const startPosition = (new Date(booking.start).getTime() - startOfToday) / dayDuration * 100;
                        const width = (new Date(booking.end).getTime() - new Date(booking.start).getTime()) / dayDuration * 100;

                        if(startPosition > 100){
                            console.log(booking);
                        }

                        const mailtoHref = `mailto:${booking.organizer}?subject=Angående%20din%20rumsbokning%20i%20${room.displayName}%20(${room.identifier.substring(0, 3)})%20kl%20${new Date(booking.start).toLocaleTimeString('sv-SE', {
                            timeStyle: 'short'
                        })}`;

                        return <div
                            alt = {booking.organizer}
                            className = "booking-wrapper"
                            key = {`${booking.roomIdentifier}-${booking.start}`}
                            style = {{
                                left: `${Math.max(startPosition, 0)}%`,
                                width: `${Math.min(width, 100)}%`,
                            }}
                            title = {booking.organizer}
                        >
                            <a href={mailtoHref}>
                                <span style={{ display: 'block'}}>
                                    {new Date(booking.start).toLocaleTimeString('sv-SE', {
                                        timeStyle: 'short',
                                    })}
                                </span>
                                <span style={{ display: 'block'}}>
                                    {'-'}
                                </span>
                                <span style={{ display: 'block'}}>
                                    {new Date(booking.end).toLocaleTimeString('sv-SE', {
                                        timeStyle: 'short',
                                    })}
                                </span>
                            </a>
                        </div>;
                    })}
                    </div>
                </div>;
            })}
        </div>
    )
}

export default Rooms;
