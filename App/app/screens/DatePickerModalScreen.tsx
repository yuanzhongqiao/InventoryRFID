import React, { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutAnimation, ScrollView, StyleSheet, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import SearchBar from 'react-native-platform-searchbar';

import DateTimePicker from '@react-native-community/datetimepicker';

import { DEFAULT_LAYOUT_ANIMATION_CONFIG } from '@app/consts/animations';

import type { RootStackParamList } from '@app/navigation/Navigation';

import useIsDarkMode from '@app/hooks/useIsDarkMode';

import InsetGroup from '@app/components/InsetGroup';
import ModalContent from '@app/components/ModalContent';
import UIGroup from '@app/components/UIGroup';

function DatePickerModalScreen({
  navigation,
  route,
}: StackScreenProps<RootStackParamList, 'DatePicker'>) {
  const { callback, defaultValue } = route.params;
  const [value, setValue] = useState(defaultValue);
  const [date, setDate] = useState(new Date(1598051730000));
  const [search, setSearch] = useState('');

  const currencies = useMemo(() => ['USD', 'TWD'], []);

  const currenciesToShow = useMemo(() => {
    if (search) {
      const searchTerm = search.toLowerCase();
      return currencies.filter(c => `${c.toLowerCase()}`.match(searchTerm));
    }

    LayoutAnimation.configureNext(DEFAULT_LAYOUT_ANIMATION_CONFIG);

    return currencies;
  }, [currencies, search]);

  const scrollViewRef = useRef<ScrollView>(null);

  const handleSelect = useCallback(() => {
    if (!value) return;

    callback(value);
    navigation.goBack();
  }, [callback, value, navigation]);

  const isCancel = useRef(false);
  const handleLeave = useCallback(
    (confirm: () => void) => {
      if (isCancel.current) return confirm();
      if (!value) return confirm();

      callback(value);
      confirm();
    },
    [callback, value],
  );

  const cancel = useCallback(() => {
    isCancel.current = true;
    navigation.goBack();
  }, [navigation]);

  const isDarkMode = useIsDarkMode();

  return (
    <ModalContent
      navigation={navigation}
      title="Pick Date"
      preventClose={true}
      confirmCloseFn={handleLeave}
      action2Label="Cancel"
      onAction2Press={cancel}
      action1Label={value ? 'Select' : undefined}
      // action1MaterialIconName="check"
      onAction1Press={handleSelect}
      action1Variant="strong"
    >
      <ModalContent.ScrollView ref={scrollViewRef}>
        <UIGroup.FirstGroupSpacing />
        <UIGroup>
          <UIGroup.ListItem label="This View is Deprecated" button />
        </UIGroup>
        {/*<DateTimePicker mode="date" display="calendar" value={date} />*/}
      </ModalContent.ScrollView>
    </ModalContent>
  );
}

const styles = StyleSheet.create({
  searchBarContainer: {
    marginTop: InsetGroup.MARGIN_HORIZONTAL,
    marginHorizontal: InsetGroup.MARGIN_HORIZONTAL,
    marginBottom: InsetGroup.MARGIN_HORIZONTAL,
  },
});

export default DatePickerModalScreen;
