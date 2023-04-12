import React from "react";

const Projects = () => {
    return (
        <div className="contents-view">
            <h2>Projects</h2>
            <div className="divider"></div>
            <div className="projects-item-group">
                <div className="single-item-card">
                    <img src="https://broccolini.net/dsc.png" alt="" />
                    <h3><a href="">Field hockey in Sierra Leone</a></h3>
                    <p>Short description of text</p>
                </div>
                <div className="single-item-card">
                    <img src="https://broccolini.net/dsc.png" alt="" />
                    <h3><a href="">Biotechnology and math</a></h3>
                    <p>Short description of text</p>
                </div>
                <div className="single-item-card">
                <img src="https://broccolini.net/dsc.png" alt="" />
                    <h3><a href="">Machine learning for biotechnology</a></h3>
                    <p>Short description of text</p>
                </div>
            </div>
        </div>
    )
}

export default Projects