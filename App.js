import React from 'react';
import {
  StyleSheet,
  Image,
  View,
  PanResponder,
  Dimensions,
  Modal,
  Alert,
  Vibration,
  Text,
} from 'react-native';
import uniq from 'lodash/uniq';
import { Gyroscope } from 'expo';
import styled from 'styled-components';
import {
  backgroundImage,
  slenderMan,
  characterUp,
  characterDown,
  characterLeft,
  characterRight,
} from 'dojo-halloween/assets/';
import { KeysIndicator, Items, Sound, Minimap } from 'dojo-halloween/src/components';
import { itemsCount, treasuresCount } from 'dojo-halloween/src/helpers/constants';
import {
  generateRandomCoordinates,
  doPointsCollide,
  getSquareDistance,
} from 'dojo-halloween/src/helpers/itemsHelper';

const backgroundDimensions = Image.resolveAssetSource(backgroundImage);

const background = { x: backgroundDimensions.width, y: backgroundDimensions.height };

const screenDimensions = Dimensions.get('screen');

const screen = { x: screenDimensions.width, y: screenDimensions.height };
const characterDirections = {
  up: characterUp,
  down: characterDown,
  left: characterLeft,
  right: characterRight,
};

export default class App extends React.Component<*> {
  initialState = {
    gyroscopeData: { x: 0, y: 0, z: 0 },
    characterDirection: 'down',
    showSlenderManModal: false,
    keysNumber: 0,
    openedItemsKeys: [],
    isFinalTreasureVisible: false,
    isInDanger: false,
    collidingElement: null,
    showTreasureIndication: false,
    initial: {
      x: 0,
      y: 0,
    },
    delta: {
      x: 0,
      y: 0,
    },
  };

  origin = { x: 0, y: 0 };

  itemsList = generateRandomCoordinates(background.x, background.y) 
  
  state = this.initialState;
 
  resetGame = () => {
    this.itemsList = generateRandomCoordinates(background.x, background.y);
    this.setState({ ...this.initialState });
  };

  componentDidMount() {
    Sound.init();
    this.subscription = Gyroscope.addListener(result => {
      this.setState({ gyroscopeData: result });
      })
  }

  componentWillUnmount() {
    this.subscription && this.subscription.remove();
  }

  handleKeysIndicator = (prevState, collidingTreasure) => {
  if( !prevState.showTreasureIndication && !!collidingTreasure ){
      this.setState({showTreasureIndication : true})
 }
 if(prevState.showTreasureIndication && !collidingTreasure){
  this.setState({showTreasureIndication : false})

 }


  };

  handleCollision = (prevState, collidingElement) => {
    if(!prevState.collidingElement && collidingElement){
  Vibration.vibrate(500)
  this.setState({collidingElement,isInDanger : true})
   }

   if(prevState.collidingElement && !collidingElement){
     this.setState({collidingElement : null})
   }


  };

  handleSlenderManModal = (prevState, collidingElement, charItem) => {
    if(this.state.isInDanger && collidingElement && getSquareDistance(collidingElement,charItem)<=10000 && !this.state.showSlenderManModal ){
      Sound.playScream(); // Joue le son
      this.setState({ showSlenderManModal: true }); // Affiche le slenderman
    }

    if(!prevState.showSlenderManModal && this.state.showSlenderManModal){
      setTimeout(() => this.setState({ showSlenderManModal: false, isInDanger: false }), 1500);
    }
  };

  handleBoxOpening = (prevState, collidingTreasure) => {

    if(collidingTreasure &&
      collidingTreasure.key &&
      !this.state.openedItemsKeys.includes(collidingTreasure.key) &&
      prevState.gyroscopeData.y <= 7 &&
      this.state.gyroscopeData.y > 7){
        const openedItems = uniq([
          ...this.state.openedItemsKeys,
          collidingTreasure.key,
          ]);
    
          this.setState({openedItemsKeys : openedItems, keysNumber : this.state.keysNumber+1, isFinalTreasureVisible : openedItems.length>=treasuresCount})

          if(!this.state.openedItemsKeys.includes(collidingTreasure.key && (collidingTreasure.type === 'good' || this.state.isFinalChestVisible) && collidingTreasure.type!='treasure')){
            Alert.alert('Bravo', 'Coffre ouvert')
          }
          if(collidingTreasure.type ==='treasure'){
            Alert.alert('Bravo','Tresor ouvert',[{text : 'OK', onPress : ()=>{}},{text : 'Recommencer le jeu', onPress : this.resetGame}])
          }
      }

  };

  componentDidUpdate(_, prevState) {
    const charItem = {
      key: String(itemsCount),
      x: background.x / 2 - this.state.initial.x - this.state.delta.x - 30,
      y: background.y / 2 - this.state.initial.y - this.state.delta.y - 30,
      type: 'character',
    };
    const collidingElement = this.itemsList.find(
      element => element.type === 'bad' && doPointsCollide(element, charItem)
    );
    const collidingTreasure = this.itemsList.find(
      element => ['good', 'treasure'].includes(element.type) && doPointsCollide(element, charItem)
    );
    this.handleKeysIndicator(prevState, collidingTreasure);
    this.handleCollision(prevState, collidingElement);
    this.handleSlenderManModal(prevState, collidingElement, charItem);
    this.handleBoxOpening(prevState, collidingTreasure);
  }

  onImageLayout = (event: ViewLayoutEvent) => {
    const { x, y } = event.nativeEvent.layout;
    if (!this.origin.x || !this.origin.y) this.origin = { x, y };
  };

  getFinalDisplacement = (diff, dimension) => {
    return diff > 0
      ? Math.min(diff, -this.origin[dimension] - this.state.initial[dimension])
      : Math.max(
          diff,
          screen[dimension] -
            background[dimension] -
            this.origin[dimension] -
            this.state.initial[dimension]
        );
  };

  handleGesture = (_, gestureState) => {
    const finalDx = this.getFinalDisplacement(gestureState.dx, 'x');
    const finalDy = this.getFinalDisplacement(gestureState.dy, 'y');

    let characterDirection = '';
      if (Math.abs(finalDx) > Math.abs(finalDy)) {
        characterDirection = finalDx < 0 ? 'right' : 'left';
      } else {
        characterDirection = finalDy < 0 ? 'down' : 'up';
      }

    this.setState({ delta: { x: finalDx, y: finalDy } , characterDirection });
  };




  resetDragState = () =>  {
    const { initial, delta } = this.state;
    this.setState({
      initial: { x: initial.x + delta.x, y: initial.y + delta.y },
      delta: { x: 0, y: 0 },
    });
  };

  panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: this.handleGesture,
    onPanResponderRelease: this.resetDragState,
  });

  render() {
    const { initial, delta } = this.state;
    const imageStyle = {
      left: initial.x + delta.x,
      top: initial.y + delta.y,
    };
    const itemContainerStyle = {
      position: 'absolute',
      left: this.origin.x + initial.x + delta.x,
      top: this.origin.y + initial.y + delta.y,
      height: background.y,
      width: background.x,
    };

    return (
      <View style={styles.container}>
        <Image onLayout={this.onImageLayout} source={backgroundImage} style={imageStyle} {...this.panResponder.panHandlers}/>
        <Image style={{position : 'absolute'}} source = {characterDirections[this.state.characterDirection]}/>
        <Items itemsList={this.itemsList} style={itemContainerStyle} foundTreasures={this.state.openedItemsKeys} isFinalTreasureVisible={this.state.isFinalTreasureVisible}/>
        <Minimap
          background={background}
          screen={screen}
          itemsList={this.itemsList}
          originDimension={this.origin}
          initialDimension={this.state.initial}
          deltaDimension={this.state.delta}
          isFinalTreasureVisible={this.state.isFinalTreasureVisible}
        />
        <Modal
          transparent
          animationType={'fade'}
          visible={this.state.showSlenderManModal}
          onRequestClose={() => {}}
        >
          <View style={styles.fullScreenStyle}>
            <Image source={slenderMan} resizeMode={'contain'} />
          </View>
        </Modal>
        <KeysIndicator keysNumber={this.state.keysNumber} />
        {this.state.showTreasureIndication && (
          <View pointerEvents="box-none" style={styles.treasureTextView}>
            <Text style={styles.treasureText}>Ouvre le coffre!</Text>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenStyle: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    position: 'absolute',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(93,93,93,0.5)',
  },
  treasureTextView: {
    flex: 1,
    position: 'absolute',
    bottom: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignSelf: 'center',
  },
  treasureText: {
    padding: 32,
    flex: 1,
    color: 'white',
  },
});
