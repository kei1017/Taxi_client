import React, { Component } from 'react';
import  SplashScreen from './src/routes/SplashScreen'
import  ReactRouter from './src/routes/ReactRouter'

export default class App extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            view : <SplashScreen />
        };
        
    }
    componentDidMount () {
        setTimeout(() => {
            this.setState({
                view : <ReactRouter/>
            })
        }, 500)
    }

    render() {
        return (
            this.state.view
        );
    }
}

