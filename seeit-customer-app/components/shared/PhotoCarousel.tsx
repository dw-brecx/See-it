import * as React from 'react';
import { View, Image, FlatList, Dimensions } from 'react-native';

export function PhotoCarousel({
  photos,
  aspectRatio = 1,
}: {
  photos: { id: string; photo_url: string }[];
  aspectRatio?: number;
}) {
  const [active, setActive] = React.useState(0);
  const width = Dimensions.get('window').width;
  if (!photos.length) {
    return (
      <View
        style={{
          width,
          aspectRatio,
          backgroundColor: '#F3F3EE',
        }}
      />
    );
  }
  return (
    <View>
      <FlatList
        data={photos}
        keyExtractor={(p) => p.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActive(idx);
        }}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.photo_url }}
            style={{ width, aspectRatio, backgroundColor: '#F3F3EE' }}
          />
        )}
      />
      {photos.length > 1 && (
        <View
          style={{
            position: 'absolute',
            bottom: 12,
            alignSelf: 'center',
            flexDirection: 'row',
            gap: 5,
          }}
        >
          {photos.map((p, i) => (
            <View
              key={p.id}
              style={{
                width: i === active ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === active ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
