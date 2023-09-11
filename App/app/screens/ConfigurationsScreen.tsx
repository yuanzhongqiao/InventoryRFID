import React from 'react';
import { StyleSheet } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';

import { useConfig } from '@app/data';

import commonStyles from '@app/utils/commonStyles';

import type { StackParamList } from '@app/navigation/MainStack';

import useColors from '@app/hooks/useColors';

import Configurations from '@app/components/Configurations';
import ScreenContent from '@app/components/ScreenContent';
import Text, { Link } from '@app/components/Text';
import UIGroup from '@app/components/UIGroup';
import Clipboard from '@react-native-clipboard/clipboard';

function ConfigurationsScreen({
  navigation,
}: StackScreenProps<StackParamList, 'Configurations'>) {
  const { contentSecondaryTextColor } = useColors();
  const { config } = useConfig();

  return (
    <ScreenContent navigation={navigation} title="Configurations">
      <ScreenContent.ScrollView>
        <UIGroup.FirstGroupSpacing />
        <Configurations />
        {config && (
          <UIGroup>
            <UIGroup.ListItem
              verticalArrangedLargeTextIOS
              label="Configuration UUID"
              monospaceDetail
              detail={config?.uuid}
              rightElement={
                <UIGroup.ListTextInputItem.Button
                  onPress={() => Clipboard.setString(config?.uuid)}
                >
                  Copy
                </UIGroup.ListTextInputItem.Button>
              }
            />
          </UIGroup>
        )}
        <UIGroup transparentBackground style={commonStyles.ph8}>
          <Text style={[styles.text, { color: contentSecondaryTextColor }]}>
            The above configurations are not changeable as changing them will
            make all your RFID tags invalid.
          </Text>
          <Text> </Text>
          <Text style={[styles.text, { color: contentSecondaryTextColor }]}>
            Instead, you can{' '}
            <Link onPress={() => navigation.push('HowToSwitchBetweenProfiles')}>
              create a new profile
            </Link>{' '}
            and configure it to suite your needs during setup.
          </Text>
        </UIGroup>
      </ScreenContent.ScrollView>
    </ScreenContent>
  );
}
export default ConfigurationsScreen;

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
});
