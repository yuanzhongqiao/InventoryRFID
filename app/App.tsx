import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { changeBarColors } from 'react-native-immersive-bars';

import Navigation from '@app/navigation';
import { usePersistedState } from '@app/hooks/usePersistedState';
import useIsDarkMode from '@app/hooks/useIsDarkMode';
import useColor from '@app/hooks/useColor';
import { darkTheme, lightTheme } from '@app/theme';

import StorybookUIRoot, {
  SetStorybookModeFunctionContext,
} from '@app/StorybookUIRoot';

function App() {
  const isDarkMode = useIsDarkMode();
  const theme = isDarkMode ? darkTheme : lightTheme;
  useEffect(() => {
    changeBarColors(isDarkMode);
  }, [isDarkMode]);

  const { backgroundColor } = useColor();

  /** A toggle to render the entire app as Storybook for development */
  const [storybookMode, setStorybookMode] = usePersistedState(
    'storybook_mode',
    false,
  );

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="rgba(0, 0, 0, 0.04)"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <SetStorybookModeFunctionContext.Provider value={setStorybookMode}>
        {(() => {
          if (storybookMode) {
            // Render Storybook (only!)
            return (
              <>
                <StatusBar
                  backgroundColor="rgba(0, 0, 0, 0.8)"
                  barStyle="light-content"
                />
                <StorybookUIRoot />
              </>
            );
          }

          // Render application
          return (
            <GestureHandlerRootView
              style={[styles.container, { backgroundColor }]}
            >
              <PaperProvider theme={theme}>
                <Navigation />
              </PaperProvider>
            </GestureHandlerRootView>
          );
        })()}
      </SetStorybookModeFunctionContext.Provider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
