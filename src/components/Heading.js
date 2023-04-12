import React from "react";

const Heading = ({title}) => {
    return ( 
        <div className="section-heading short-bottom ">
            <div className="heading central">
                <h3 className="text-lg font-medium"><a href="/">thisiscrispin</a></h3>
                <h1 className="text-5xl font-bold pb-2">{ title }</h1>
                <p></p>
            </div>
            <div className="centered-colourbar"></div>
        </div>
    )
}

export default Heading