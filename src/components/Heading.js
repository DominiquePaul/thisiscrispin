import React from "react";

const Heading = ({title}) => {
    return ( 
        <div className="section-heading short-bottom ">
            <div className="heading central">
                <h4><a href="/">thisiscrispin</a></h4>
                <h1>{ title }</h1>
                <p></p>
            </div>
            <div className="centered-colourbar"></div>
        </div>
    )
}

export default Heading