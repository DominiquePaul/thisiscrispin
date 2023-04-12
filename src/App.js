// dont need to add .js at the end
import React from 'react';
import Home from "./components/Home"
import Navbar from "./components/Navbar"
import { Footer, Footer2 } from "./components/Footer"
import About from "./components/About"
import Freelance from "./components/Freelance"
import Posts from "./components/Posts"
// import { BrowserRouter as Router, Route, Switch} from "react-router-dom";
// import Layout from '../containers/Layout'
// import { Router,Route} from 'react-router-dom';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'



function App() {

    return (
        <div className="main  flexbox-c flex-wrapper">
            <Navbar/>   
            <Router>
                <Routes>
                    <Route exact path="/" element={<Home/>}/>
                    <Route path="/about" element={<div><About/><Footer/></div>}/>
                    <Route path="/freelance" element={<div><Freelance/><Footer/></div>}/>
                    <Route path="/posts" element={<div><Posts/><Footer/></div>}/>
                </Routes>
            </Router>                    
        </div>
        
    );
  }

// in the end we always
export default App;
