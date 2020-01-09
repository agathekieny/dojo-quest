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

  itemsList = [];

  state = this.initialState;

  resetGame = () => {
    this.itemsList = generateRandomCoordinates(background.x, background.y);
    this.setState({ ...this.initialState });
  };

  componentDidMount() {
    Sound.init();
  }

  componentWillUnmount() {
    this.subscription && this.subscription.remove();
  }

  handleKeysIndicator = (prevState, collidingTreasure) => {};

  handleCollision = (prevState, collidingElement) => {};

  handleSlenderManModal = (prevState, collidingElement, charItem) => {};

  handleBoxOpening = (prevState, collidingTreasure) => {};

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

  handleGesture = (_, gestureState) => {};

  resetDragState = () => {};

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
        <Image onLayout={this.onImageLayout} source={backgroundImage} style={imageStyle} />
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
