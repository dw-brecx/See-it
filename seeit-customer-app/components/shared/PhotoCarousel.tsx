import * as React from 'react';
import { View, Image, FlatList, Dimensions, Pressable } from 'react-native';
import { PhotoLightbox } from './PhotoLightbox';

export function PhotoCarousel({
  photos,
  aspectRatio = 1,
  enableLightbox = true,
}: {
  photos: { id: string; photo_url: string }[];
  aspectRatio?: number;
  enableLightbox?: boolean;
}) {
  const [active, setActive] = React.useState(0);
  const [lightboxStart, setLightboxStart] = React.useState<number | null>(null);
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
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => enableLightbox && setLightboxStart(index)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Photo ${index + 1} of ${photos.length}`}
          >
            <Image
              source={{ uri: item.photo_url }}
              style={{ width, aspectRatio, backgroundColor: '#F3F3EE' }}
            />
          </Pressable>
        )}
      />
      {photos.length > 1 && (
        <View
          pointerEvents="none"
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
      <PhotoLightbox
        open={lightboxStart !== null}
        photos={photos}
        startIndex={lightboxStart ?? 0}
        onClose={() => setLightboxStart(null)}
      />
    </View>
  );
}
