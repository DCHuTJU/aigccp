import csv
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

client_id = 'c53a3d739acb490794bb6d125fb8bfda'
client_secret = 'ed768467be4f4d6d84bf1d39e078f928'

client_credentials_manager = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)

# 指定你想要的字段
fields = ["歌曲名称", "风格", "创作者", "作者"]

limit = 50

# 创建一个新的CSV文件，并写入数据
with open('music_dataset.csv', 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=fields)
    writer.writeheader()

    # 指定需要搜索的流派
    genres = ["pop", "rock", "opera", "folk", "jazz", "rap", "electronic", "metal", "new age"]

    # 对于每个流派，执行搜索并保存结果
    for genre in genres:
       for i in range(0, 2):
            results = sp.search(q=f'genre:"{genre}"', type='track', limit=limit, offset=i*limit)

            for track in results['tracks']['items']:
                try:
                    song_name = track['name']
                    artist_name = track['artists'][0]['name']
                    record_label = sp.album(track['album']['id'])['label']
                
                    # 写入数据
                    writer.writerow({"歌曲名称": song_name, "风格": genre, "创作者": record_label, "作者": artist_name})
                except Exception as e:
                    print(f"Error occurred for track {track['id']}: {e}")
