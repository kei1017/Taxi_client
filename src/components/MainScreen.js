import React, { Component } from 'react';
import { View, StatusBar, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import styles from '../styles/styles'

const modalStyle = StyleSheet.create({
    modalBackground: {       
        flex:1, 
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'space-around',
        backgroundColor: '#00000040'
    },
    activityIndicatorWrapper: {
        backgroundColor: '#FFFFFF',
        height: 100,
        width: 100,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around'
    }
});


class MainScreen extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { children, waiting } = this.props;
        return (
            <View style={styles.pageBackground}>
                <StatusBar                    
                    barStyle="light-content"
                />
                <View style={styles.mainContainer}>
                    {children}
                </View>                
                <Modal
                    transparent={true}                    
                    animationType={'none'}
                    visible={waiting}
                    onRequestClose={() => { console.log('close modal') }}>
                    <View style={modalStyle.modalBackground}>
                        <View style={modalStyle.activityIndicatorWrapper}>
                            <ActivityIndicator
                                animating={true} size="large" />
                        </View>
                    </View>
                </Modal>
            </View>
        )
    }
}

MainScreen.defaultProps = {    
    waiting:false,
}
export default MainScreen;