#!/usr/bin/env node
import { YouTube, ContentStreamType } from 'media-api';
import commandLineArgs from 'command-line-args';
import Speaker from 'speaker';
import ffmpeg from 'fluent-ffmpeg';
import blessed from 'blessed';

const screen = blessed.screen({
  smartCSR: true,
  title: 'inifniplayer',
  fullUnicode: true,
});

const box = blessed.box({
  top: 'center',
  left: 'center',
  width: '50%',
  height: '50%',
  content: 'Not playing',
  label: 'infiniplayer',
  align: 'center',
  valign: 'middle',
  tags: true,
  border: {
    type: 'line',
  },
  style: {
    fg: 'white',
    border: {
      fg: '#f0f0f0',
    },
  },
});
screen.append(box);

screen.render();

const optionDefinitions = [
  { name: 'id', type: String, multiple: false, defaultOption: true },
];

function onTrackChanged(title: string, nextTitle?: string) {
  screen.title = title + ' - infiniplayer';
  box.setContent(
    'Currently playing: ' + title + '\nNext up: ' + (nextTitle || 'nothing')
  );
  screen.render();
}

async function play(id: string) {
  const youtube = new YouTube();
  const content = await youtube.content(id);
  if (!content) {
    box.setContent('Playback failure.');
    return;
  }

  const next = content.related?.[0];

  const onFinish = () => {
    if (!next) {
      box.setContent('Ran out of music...');
      return;
    }

    play(next.id);
  };

  if (content?.streams) {
    onTrackChanged(content.title, next?.title);
    for (let stream of content.streams.sort(
      (a, b) => (b.bitrate || 0) - (a.bitrate || 0)
    )) {
      if (stream.type === ContentStreamType.AUDIO) {
        ffmpeg(stream.url)
          .addOption('-ar', '44100')
          .toFormat('s16le')
          .pipe(new Speaker())
          .on('finish', onFinish);
        return;
      }
    }
  }
}

const options: { id: string } = commandLineArgs(optionDefinitions) as any;
play(options.id);
