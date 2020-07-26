#!/usr/bin/env node
import { YouTube, ContentStreamType } from 'media-api';
import { ReadStream } from 'fs';
import commandLineArgs from 'command-line-args';
import Speaker from 'speaker';
import ffmpeg from 'fluent-ffmpeg';
import fetch from 'node-fetch';

const optionDefinitions = [
  { name: 'id', type: String, multiple: false, defaultOption: true },
];

async function play(id: string) {
  const youtube = new YouTube();
  const content = await youtube.content(id);
  if (!content) {
    console.log('Playback failure.');
    return;
  }

  if (content?.streams) {
    console.log('Playing: ' + content.title);
    for (let stream of content.streams.sort(
      (a, b) => (b.bitrate || 0) - (a.bitrate || 0)
    )) {
      if (stream.type === ContentStreamType.AUDIO) {
        ffmpeg(stream.url)
          .addOption('-ar', '44100')
          .toFormat('s16le')
          .pipe(new Speaker())
          .on('end', () => {
            if (!content.related?.[0]) {
              console.log('Ran out of music...');
              return;
            }

            play(content.related[0].id);
          });
        return;
      }
    }
  }
}

const options: { id: string } = commandLineArgs(optionDefinitions) as any;
play(options.id);
