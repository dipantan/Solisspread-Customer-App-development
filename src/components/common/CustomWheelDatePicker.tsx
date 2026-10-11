import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { COLORS, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - 25 + i);

const WheelColumn = ({ data, selectedIndex, onChange, itemWidth }: any) => {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
      }, 100);
    }
  }, [selectedIndex]);

  const handleMomentumScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    let index = Math.round(offsetY / ITEM_HEIGHT);
    if (index < 0) index = 0;
    if (index > data.length - 1) index = data.length - 1;
    onChange(index);
  };

  return (
    <View style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS, width: itemWidth }}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
      >
        {data.map((item: any, index: number) => {
          const isSelected = index === selectedIndex;
          return (
            <View key={index} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ 
                fontSize: 16, 
                color: isSelected ? COLORS.textPrimary : COLORS.textTertiary,
                fontWeight: isSelected ? '500' : '400'
              }}>
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default function CustomWheelDatePicker({ visible, value, onClose, onSelect }: any) {
  const initialDate = value || new Date();
  const [month, setMonth] = useState(initialDate.getMonth());
  const [year, setYear] = useState(initialDate.getFullYear());
  const [day, setDay] = useState(initialDate.getDate());

  useEffect(() => {
    if (visible) {
      const d = value || new Date();
      setMonth(d.getMonth());
      setYear(d.getFullYear());
      setDay(d.getDate());
    }
  }, [visible, value]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    if (day > daysInMonth) {
      setDay(daysInMonth);
    }
  }, [month, year, daysInMonth, day]);

  const yearIndex = YEARS.indexOf(year);
  const safeYearIndex = yearIndex === -1 ? 25 : yearIndex;

  const handleConfirm = () => {
    onSelect(new Date(year, month, day));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Select date</Text>
          
          <View style={styles.pickerContainer}>
            <View style={styles.selectionLines} pointerEvents="none">
              <View style={styles.line} />
              <View style={styles.line} />
            </View>
            
            <WheelColumn 
              data={MONTHS} 
              selectedIndex={month} 
              onChange={setMonth}
              itemWidth={110}
            />
            <WheelColumn 
              data={DAYS} 
              selectedIndex={day - 1} 
              onChange={(idx: number) => setDay(idx + 1)}
              itemWidth={50}
            />
            <WheelColumn 
              data={YEARS} 
              selectedIndex={safeYearIndex} 
              onChange={(idx: number) => setYear(YEARS[idx])}
              itemWidth={80}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.btn}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.btn}>
              <Text style={styles.btnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#F3F4F9',
    width: width * 0.85,
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.card,
  },
  title: {
    fontSize: 18,
    color: '#333',
    marginBottom: 24,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
  },
  selectionLines: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 10,
    right: 10,
    height: ITEM_HEIGHT,
    justifyContent: 'space-between',
    zIndex: -1,
  },
  line: {
    height: 1,
    backgroundColor: '#999',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 32,
    gap: 8,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  btnText: {
    fontSize: 15,
    color: '#4B6296',
    fontWeight: '500',
  },
});
