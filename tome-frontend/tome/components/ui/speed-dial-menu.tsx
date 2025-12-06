import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
} from 'react-native';
import { SpeedDialItem } from './speed-dial-item';

interface SpeedDialMenuProps {
  visible: boolean;
  onClose: () => void;
  onLogReading: () => void;
  onCreateList: () => void;
}

const ITEM_STAGGER_DELAY = 50;
const BACKDROP_FADE_DURATION = 200;

export function SpeedDialMenu({
  visible,
  onClose,
  onLogReading,
  onCreateList,
}: SpeedDialMenuProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(backdropOpacity, {
        toValue: 0.5,
        duration: BACKDROP_FADE_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: BACKDROP_FADE_DURATION,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, backdropOpacity]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          />

          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              <SpeedDialItem
                icon="book-outline"
                label="Log Reading"
                onPress={onLogReading}
                delay={ITEM_STAGGER_DELAY}
                visible={visible}
              />
              <SpeedDialItem
                icon="list-outline"
                label="Create List"
                onPress={onCreateList}
                delay={ITEM_STAGGER_DELAY * 2}
                visible={visible}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  menuContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Position above FAB
  },
});
