import React, { useCallback, useState } from 'react';
import { View, ScrollView, TouchableWithoutFeedback } from 'react-native';

import type { StackScreenProps } from '@react-navigation/stack';
import type { StackParamList } from '@app/navigation/MainStack';
import { useRootNavigation } from '@app/navigation/RootNavigationContext';
import { useFocusEffect } from '@react-navigation/native';

import Color from 'color';
import commonStyles from '@app/utils/commonStyles';
import useColors from '@app/hooks/useColors';
import ScreenContent from '@app/components/ScreenContent';
import InsetGroup from '@app/components/InsetGroup';
import Icon, { IconName, IconColor } from '@app/components/Icon';

import { useRelationalData } from '@app/db';

import ItemItem from '../components/ItemItem';

function CollectionScreen({
  navigation,
  route,
}: StackScreenProps<StackParamList, 'Collection'>) {
  const rootNavigation = useRootNavigation();
  const { id, initialTitle } = route.params;
  const { data, reloadData } = useRelationalData('collection', id);

  useFocusEffect(
    useCallback(() => {
      reloadData();
    }, [reloadData]),
  );

  const collection = data?.data;

  const handleAddNewItem = useCallback(
    () =>
      rootNavigation?.push('SaveItem', {
        initialData: {
          collection: collection?.id,
          iconName: collection?.itemDefaultIconName,
        },
        afterSave: item => {
          item.id &&
            item.itemReferenceNumber &&
            navigation.push('Item', { id: item.id });
        },
      }),
    [collection, navigation, rootNavigation],
  );

  const [devModeCounter, setDevModeCounter] = useState(0);

  const { textOnDarkBackgroundColor } = useColors();

  return (
    <ScreenContent
      navigation={navigation}
      title={data?.data ? data?.data.name : initialTitle || 'Collection'}
      action1Label="Edit"
      action1SFSymbolName={(data && 'square.and.pencil') || undefined}
      action1MaterialIconName={(data && 'pencil') || undefined}
      onAction1Press={
        collection
          ? () =>
              rootNavigation?.navigate('SaveCollection', {
                initialData: collection,
              })
          : undefined
      }
      // action2Label={(data && 'Delete') || undefined}
      // action2SFSymbolName={(data && 'trash') || undefined}
      // action2MaterialIconName={(data && 'delete') || undefined}
      // onAction2Press={handleDelete}
    >
      <ScrollView keyboardDismissMode="interactive">
        <InsetGroup style={commonStyles.mt2} loading={!collection}>
          <TouchableWithoutFeedback
            onPress={() => {
              setDevModeCounter(v => v + 1);
            }}
          >
            <View style={[commonStyles.row, commonStyles.centerChildren]}>
              <InsetGroup.Item
                vertical2
                label="Collection Name"
                detail={collection?.name}
                containerStyle={[commonStyles.flex1]}
              />
              <Icon
                showBackground
                name={collection?.iconName as IconName}
                color={collection?.iconColor as IconColor}
                size={40}
                style={{ marginRight: InsetGroup.MARGIN_HORIZONTAL }}
              />
            </View>
          </TouchableWithoutFeedback>
          {devModeCounter > 10 && (
            <>
              <InsetGroup.ItemSeperator />
              <InsetGroup.Item
                vertical2
                label="ID"
                detailTextStyle={commonStyles.monospaced}
                detail={collection?.id}
              />
            </>
          )}
          <InsetGroup.ItemSeperator />
          <InsetGroup.Item
            vertical2
            label="Reference Number"
            detailTextStyle={commonStyles.monospaced}
            detail={collection?.collectionReferenceNumber}
          />
        </InsetGroup>
        <InsetGroup
          label="Items"
          labelVariant="large"
          loading={!collection}
          labelRight={
            <InsetGroup.LabelButton onPress={handleAddNewItem}>
              <Icon
                name="add"
                sfSymbolWeight="bold"
                color={textOnDarkBackgroundColor}
              />{' '}
              New Item
            </InsetGroup.LabelButton>
          }
        >
          {(() => {
            const itemElements = (
              data?.getRelated('items', { arrElementType: 'item' }) || []
            )
              .flatMap(item => [
                <ItemItem
                  key={item.id}
                  item={item}
                  onPress={() =>
                    navigation.push('Item', {
                      id: item.id || '',
                      initialTitle: item.name,
                    })
                  }
                />,
                <InsetGroup.ItemSeperator key={`s-${item.id}`} />,
              ])
              .slice(0, -1);

            if (itemElements.length > 0) return itemElements;

            return <InsetGroup.Item label="No Items" disabled />;
          })()}
          {/*<InsetGroup.ItemSeperator />
          <InsetGroup.Item
            button
            label="Add New Item"
            onPress={handleAddNewItem}
          />*/}
        </InsetGroup>
      </ScrollView>
    </ScreenContent>
  );
}

export default CollectionScreen;
