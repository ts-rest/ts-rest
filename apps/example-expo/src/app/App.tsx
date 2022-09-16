import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableHighlight,
} from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from './data';
import { useTailwind } from 'tailwind-rn';
import { TailwindProvider } from 'tailwind-rn';
import utilities from '../../tailwind.json';
import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  StackScreenProps,
} from '@react-navigation/stack';

import 'react-native-gesture-handler';

const FIVE_MINUTES = 1000 * 60 * 5;

export const queryClient = new QueryClient();

type RootStackParamList = {
  Posts: undefined;
  Post: { id: string };
};

const Posts = ({
  navigation,
}: StackScreenProps<RootStackParamList, 'Posts'>) => {
  const tailwind = useTailwind();

  const { data, isLoading } = apiClient.getPosts.useQuery(
    ['posts'],
    {
      query: { skip: 0, take: 10 },
    },
    { staleTime: FIVE_MINUTES }
  );

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  const posts = data?.body?.posts || [];

  return (
    <View style={tailwind('px-4')}>
      <TextInput onChangeText={() => undefined} value={''} />
      <Text style={tailwind('text-xl font-bold')}>Posts</Text>
      <ScrollView style={{ height: '100%' }}>
        {posts.map((post) => (
          <TouchableHighlight
            onPress={() => navigation.navigate('Post', { id: post.id })}
            key={post.id}
          >
            <View style={tailwind('my-4')}>
              <Text style={tailwind('')}>{post.title}</Text>
            </View>
          </TouchableHighlight>
        ))}
      </ScrollView>
    </View>
  );
};

const Post = (props: StackScreenProps<RootStackParamList, 'Post'>) => {
  const tailwind = useTailwind();

  const { data, isLoading } = apiClient.getPost.useQuery(
    ['post', props.route.params.id],
    {
      params: { id: props.route.params.id },
    },
    {
      staleTime: FIVE_MINUTES,
    }
  );

  const post = data?.body;

  if (isLoading || !post) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={tailwind('px-4')}>
      <Text style={tailwind('text-xl font-bold')}>{post.title}</Text>
      <Text style={tailwind('')}>{post.content}</Text>
    </View>
  );
};

const Stack = createStackNavigator<RootStackParamList>();

function MyStack() {
  return (
    <Stack.Navigator initialRouteName="Posts">
      <Stack.Screen name="Posts" component={Posts} />
      <Stack.Screen name="Post" component={Post} />
    </Stack.Navigator>
  );
}

const LotsOfGreetings = () => {
  return (
    <NavigationContainer>
      {/* @ts-expect-error TailwindProvider being weird */}
      <TailwindProvider utilities={utilities}>
        <QueryClientProvider client={queryClient}>
          <MyStack />
        </QueryClientProvider>
      </TailwindProvider>
    </NavigationContainer>
  );
};

export default LotsOfGreetings;
