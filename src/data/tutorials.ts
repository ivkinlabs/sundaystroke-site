import { sitePath } from '../utils/paths';
import type {
  Clip,
  LinkedBlock,
  ParagraphBlock,
  StepsBlock,
  SubheadingBlock,
  TipsBlock,
  Tutorial,
  TutorialCategory,
  TutorialCategoryGroup,
  TutorialLink,
  TutorialSetting,
} from '../types/tutorial';

export const TUTORIALS_PUBLISHED: string = '29 October 2026';
export const TUTORIALS_UPDATED: string = '30 October 2026';

function p(text: string): ParagraphBlock {
  return { kind: 'paragraph', text };
}

function sub(text: string): SubheadingBlock {
  return { kind: 'subheading', text };
}

function steps(items: readonly string[]): StepsBlock {
  return { kind: 'steps', items };
}

function tips(items: readonly string[]): TipsBlock {
  return { kind: 'tips', items };
}

function linked(before: string, link: TutorialLink, after: string): LinkedBlock {
  return { kind: 'linked', before, link, after };
}

const TRACER_LINK: TutorialLink = { href: sitePath('/tracer/'), label: 'SundayStroke Tracer for golf' };
const DISC_LINK: TutorialLink = { href: sitePath('/tracer/disc-golf/'), label: 'SundayStroke Tracer for disc golf' };
const MANUAL_LINK: TutorialLink = { href: sitePath('/manual-tracing'), label: 'manual tracing reference' };
const GOLF_GPS_LINK: TutorialLink = { href: sitePath('/golf-gps/'), label: 'SundayStroke Golf GPS' };

const GOLF_AFTER: Clip = { src: '/media/learn/golf-result.mp4', poster: '/media/learn/golf-result.jpg', label: 'The traced ball flight' };
const DISC_AFTER: Clip = { src: '/media/learn/disc-golf-result.mp4', poster: '/media/learn/disc-golf-result.jpg', label: 'The traced disc flight' };
const DISC_EDITING: Clip = { src: '/media/learn/disc-golf-editing.mp4', poster: '/media/learn/disc-golf-editing.jpg', label: 'Editing: key points placed along a Free curve line' };

const STABILIZATION: TutorialSetting = {
  name: 'Stabilization',
  value: 'Smart, Fast or Off',
  when: 'If the camera was still, turning it off speeds things up. If the line jumps suddenly, try changing from Smart to Fast.',
};
const RENDER_3D: TutorialSetting = {
  name: '3D look',
  value: 'On or off, as you prefer',
  when: 'Gives the line a sense of depth rather than a flat stroke on the picture.',
};
const LINE_WIDTH: TutorialSetting = {
  name: 'Line width',
  value: 'Adjust to suit the clip',
  when: 'Preview on your phone and choose a width that stays visible without covering the ball or disc.',
};

export const TUTORIAL_GROUPS: readonly TutorialCategoryGroup[] = [
  {
    category: 'golf',
    heading: 'Golf: start with your first golf video',
    intro: 'Trace golf follows a golf ball on its own once you select it at the start of the flight. Start here if you have a swing on your phone.',
  },
  {
    category: 'disc-golf',
    heading: 'Disc golf: trace a disc flight',
    intro: 'Discs use Free curve. Select the disc at release and Tracer can follow it, then you add or move key points wherever the line needs help.',
  },
  {
    category: 'editing',
    heading: 'Editing: fix, label and finish a trace',
    intro: 'These guides work on a trace you have already made, in either mode: repair a line that drifts, add a distance label, and hide the line behind trees.',
  },
];

export const TUTORIALS: readonly Tutorial[] = [
  {
    slug: 'film-a-golf-ball-flight',
    category: 'golf',
    title: 'How to add a golf ball tracer to an iPhone video',
    pageTitle: 'How to Add a Golf Ball Tracer to iPhone Video · SundayStroke',
    description: 'Film a clear golf shot, select the ball, review automatic tracking and save the result. An iPhone tutorial with a real traced clip.',
    summary: 'Film a swing, select the ball in Trace golf, check the arc, save.',
    intro: [
      'To add a golf ball flight line, open Trace golf, select your video and select the ball at the start of its flight. Review the automatic trace, adjust the arc or landing point, then save to Photos. You do it all in SundayStroke Tracer on the phone you filmed with.',
      'This guide covers filming, the steps in the app, the line settings and the fixes when a trace goes wrong. The clip below is a real swing traced in the app.',
    ],
    hero: null,
    clips: [GOLF_AFTER],
    sections: [
      {
        heading: 'What you need before filming',
        blocks: [
          p('An iPhone with Tracer, a golfer and somewhere you can see the ball fly. No tripod is required: the line stays in place when the camera moves. Wipe the lens first, because a clear view of the ball helps automatic tracking.'),
        ],
      },
      {
        heading: 'Position the iPhone and keep the flight in frame',
        blocks: [
          sub('Choose a clear viewpoint and background'),
          p('Film from behind the golfer, looking down the target line. The ball climbs away from the camera and a draw or fade shows clearly.'),
          tips([
            'Stand about 3 to 4 meters (10 to 12 feet) behind the golfer and a little to the side, so the body does not hide the ball at impact.',
            'Hold the phone at hip to chest height; lower makes the flight look higher.',
            'Frame the golfer in the lower third of the picture and leave the top two thirds for sky and the flight.',
            'Choose a background that contrasts with the ball and has as little visual clutter as possible. Keep the ball visible just after impact. A white ball against a pale grey sky is hard to follow.',
            'Keep the sun behind you or to the side.',
          ]),
          sub('Camera settings that help'),
          tips([
            'Use the 1x lens. Zoom softens the ball and 0.5x makes it tiny.',
            'Touch and hold on the golfer before recording to lock focus and exposure (AE/AF Lock), so the camera does not refocus on the sky mid-swing.',
            'In good light, normal video at 60 frames per second is a useful starting point. Higher frame rates capture more moments of the flight but do not guarantee a sharper ball. Check a short test clip, especially in low light.',
          ]),
          sub('Film handheld with controlled movement'),
          p('Start recording two or three seconds before the swing and keep filming until the ball lands or disappears. Hold still through impact, then follow the ball slowly if it leaves the frame. A smooth, slow pan is fine; a fast whip is what loses the ball.'),
        ],
      },
      {
        heading: 'Import the video and select the starting ball',
        blocks: [
          steps([
            'Open Tracer and tap Trace golf on the home screen.',
            'Pick your video from Photos.',
            'Scroll the timeline to the frame where the ball has just left the club. The ball should be clearly visible and separated from the clubhead.',
            'Zoom in with two fingers and move the cursor onto the golf ball to select it.',
            'Let Tracer follow the ball through the flight on its own.',
          ]),
          p('Choose an early frame in which the ball is clearly separated from the clubhead.'),
        ],
      },
      {
        heading: 'Review tracking and correct the arc',
        blocks: [
          p('Tap Preview and watch the line against the ball. When something is off:'),
          tips([
            'Landing point: scroll to the frame where the ball lands and move the landing point onto it.',
            'Arc: drag the diamond on the curve to make the flight higher, lower or more curved until the line sits on the ball.',
            'Wrong object: if tracking jumped to a bird or another ball, resize the track in the timeline to leave those frames out.',
          ]),
          linked('When tracking misses the ball completely, you can trace it by hand. The ', MANUAL_LINK, ' covers every control.'),
        ],
      },
      {
        heading: 'Choose the line style and export',
        blocks: [
          p('Pick a color or gradient, the width and the 3D look. Floodlit and white lines are free; Premium adds more styles, gradients and effects such as electricity, wave, tail length and landing effects.'),
          p('When it looks right, save the video to Photos and share it from there. Free saves carry a small watermark; Premium saves have none.'),
        ],
      },
    ],
    settings: [{ name: 'Mode', value: 'Trace golf', when: 'Any golf shot that flies through the air: drives, irons, wedges and chips.' }, STABILIZATION, RENDER_3D, LINE_WIDTH],
    troubleshooting: [
      {
        problem: 'The line drifts away from the ball',
        cause: 'Camera movement, motion blur or lost tracking.',
        fix: 'Move the landing point and the diamond to pull the arc back onto the ball. If the line jumps suddenly, try changing stabilization from Smart to Fast in Settings.',
      },
      {
        problem: 'Tracking picks up the wrong object',
        cause: 'Another ball, a bird or a flag crossed the flight.',
        fix: 'Resize the track in the timeline so it ends before the wrong object appears, then set the landing point by hand.',
      },
      {
        problem: 'The ball is lost against the sky',
        cause: 'A white ball against a pale sky has almost no contrast.',
        fix: 'Set the landing point and shape the arc by hand for the part you cannot see. Next time, film with trees or a hill behind the early flight.',
      },
      {
        problem: 'The camera was shaky',
        cause: 'Fast, jerky movement blurs the ball across several frames.',
        fix: 'Check the line through the shakiest part, then correct it with the landing point and arc. A ball that never shows clearly cannot be recovered.',
      },
    ],
    faqs: [
      { question: 'Must the camera be perfectly still?', answer: 'No. The line stays in place when the camera moves, but keeping the ball in view and avoiding sudden movement gives Tracer better footage to work with.' },
      { question: 'Can I trace a shot hit into a net or a simulator screen?', answer: 'Tracer needs to see the ball fly, so a net only gives it the first few feet. You can still draw a flight with the landing point and arc, but it is your picture of the shot, not the ball\'s real path.' },
      { question: 'Do I have to start again if the trace is wrong?', answer: 'No. Move the landing point, drag the diamond or trim the track first, before redoing anything.' },
    ],
    relatedSlugs: ['trace-golf-video-without-tripod', 'fix-a-trace-by-hand', 'add-distance-label-to-golf-video'],
    productLink: TRACER_LINK,
  },
  {
    slug: 'film-a-disc-flight',
    category: 'disc-golf',
    title: 'How to trace a disc golf flight on iPhone',
    pageTitle: 'How to Trace a Disc Golf Flight on iPhone · SundayStroke',
    description: 'Add a flight line to a disc golf throw with Free curve. Select the disc at release, add or move key points where the line drifts, then save the video.',
    summary: 'Select the disc and correct the line in Free curve.',
    intro: [
      'SundayStroke Tracer handles discs in its Free curve mode: select the disc at release and Tracer can follow it, then you add or move key points wherever the line needs help.',
      'This guide is about the editing: selecting the disc, correcting the line and checking the timing. Below is a real traced throw.',
    ],
    hero: null,
    clips: [DISC_AFTER],
    sections: [
      {
        heading: 'Film the release and the complete disc flight',
        blocks: [
          p('The trace can only be as good as what the camera saw. Two things matter most: a clear view of the disc leaving the hand, and as much of the flight in the frame as possible.'),
          tips([
            'Keep the thrower\'s body from covering the release.',
            'Use the 1x lens, lock focus and exposure by touching and holding on the thrower, and start recording before the run-up.',
            'Keep recording until the disc lands. A trace that stops mid-air looks unfinished.',
            'Bright disc colors such as orange, pink and yellow are far easier to follow against trees than white or grey plastic.',
          ]),
          linked('For camera positions, including where to prop the phone when you are on your own, see ', { href: sitePath('/learn/add-tracer-to-disc-golf-video/'), label: 'how to film disc golf on iPhone when playing solo' }, '.'),
        ],
      },
      {
        heading: 'Open Free curve and select the release frame',
        blocks: [
          steps([
            'Open Tracer and tap Free curve on the home screen.',
            'Pick your throw from Photos.',
            'Scroll the timeline to the frame where the disc has just left the hand and is clear of the arm.',
            'Zoom in with two fingers and move the cursor onto the disc to select it.',
            'Let Tracer follow the disc through the flight, then play it back.',
          ]),
          p('Choose a frame where the disc is clearly separated from the hand and arm, so the cursor sits on the disc alone.'),
        ],
      },
      {
        heading: 'Place points where the flight changes',
        blocks: [
          p('Watch the playback and look for the places where the line leaves the disc. Add a key point where the line departs from the disc. Start with a few useful points and add more only where the visible flight requires them.'),
          sub('Early flight'),
          p('The first meters are fast and the disc is often small against the trees. Check that the line leaves the hand in the right direction, and add a point just after release if it does not.'),
          sub('Turn and fade'),
          p('Follow the flight visible in your clip. A right-handed backhand may turn right before fading left; a right-handed forehand usually has the opposite tendency. Left-handed throws reverse those directions. Disc stability, release angle, speed and wind can change the shape, so place points where your disc actually travels.'),
          sub('Landing or basket approach'),
          p('Add a point where the disc lands, hits the chains or touches the ground. If it skips or rolls, decide whether you want the line to stop at the first touch or follow it on the ground, and place the last point there.'),
        ],
      },
      {
        heading: 'Check timing and line alignment',
        blocks: [
          p('Tap Preview and watch the line grow with the disc, not ahead of or behind it. If it runs ahead, that point is on the wrong frame: scroll to where the disc really is and move it. Watch once at normal speed and once scrubbing slowly through the turn.'),
        ],
      },
      {
        heading: 'Style and save the video',
        blocks: [
          p('Choose a line color that stands out from the trees and sky, set the width, and turn on the 3D look if you like it. A gradient or effects such as electricity or wave come with Premium. Save to Photos when it looks right; free saves carry a small watermark.'),
        ],
      },
    ],
    settings: [{ name: 'Mode', value: 'Free curve', when: 'Every disc throw: drives, approaches, rollers and putts.' }, STABILIZATION, RENDER_3D, LINE_WIDTH],
    troubleshooting: [
      {
        problem: 'The line drifts off the disc in the turn',
        cause: 'The disc changes direction and shrinks as it flies away.',
        fix: 'Add a key point at the frame where the line leaves the disc, and move it onto the disc.',
      },
      {
        problem: 'Tracking follows the wrong object',
        cause: 'A bird, a falling leaf or another player crossed the disc.',
        fix: 'Add or move key points on the disc through that part of the flight.',
      },
      {
        problem: 'The disc disappears behind trees',
        cause: 'The camera cannot see the disc, so nothing can follow it there.',
        fix: 'Place points where it went in and came out. For the hidden part, see the guide to showing a flight behind trees.',
      },
      {
        problem: 'The disc is too small to see',
        cause: 'Long drives filmed from far away end up as a few pixels.',
        fix: 'Zoom in with two fingers to place points precisely. Next time, film closer or from behind the thrower so the disc stays in view longer.',
      },
    ],
    faqs: [
      { question: 'Does Tracer follow a disc automatically?', answer: 'Yes, in Free curve. Select the disc at release and Tracer can follow it. Where the line drifts, add or move key points by hand.' },
      { question: 'How many key points should I add?', answer: 'Start with enough to describe the visible flight, then add points where the line departs from the disc. More points help at changes in direction, not everywhere.' },
      { question: 'What happens when the disc leaves the frame?', answer: 'Nothing in the video shows where it went after that. End the line at the edge of the frame, or keep it short of the edge so it does not look cut off.' },
    ],
    relatedSlugs: ['add-tracer-to-disc-golf-video', 'fix-a-trace-by-hand', 'trace-behind-trees'],
    productLink: DISC_LINK,
  },
  {
    slug: 'fix-a-trace-by-hand',
    category: 'editing',
    title: 'Fix a missing or drifting tracer line',
    pageTitle: 'Fix a Missing or Drifting Tracer Line · SundayStroke',
    description: 'Repair a golf or disc trace that misses the flight. Adjust the arc, landing point or key points, trim wrong tracking, and review the line where the camera moves.',
    summary: 'Repair the arc, landing point or key points, and trim wrong tracking.',
    intro: [
      'When a trace misses the flight, start with the part that is wrong: the golf arc, landing point or Free curve key points. It may be a landing point in the wrong place, a line that slipped as the camera moved, or a few frames where Tracer followed something else.',
      'This guide starts with the symptom you can see, explains the likely cause, and shows the repair for both modes. The clips show key points being placed by hand on a disc throw, and the finished line.',
    ],
    hero: null,
    clips: [DISC_EDITING, DISC_AFTER],
    sections: [
      {
        heading: 'Identify what went wrong',
        blocks: [
          p('Play the trace back once at normal speed and once while scrubbing slowly. Most problems fall into one of three groups, and each has a different fix.'),
          sub('Tracking follows the wrong object'),
          p('The line jumps sideways or suddenly heads somewhere the ball or disc never went. Something crossed the flight: another ball on the range, a bird, a flag or a player. Fix it by trimming the track, below.'),
          sub('The line drifts when the camera moves'),
          p('If the line slips as the camera moves, camera movement may be contributing to the error. Check whether the line still follows the visible ball or disc, then adjust the golf arc and landing point or the Free curve key points as needed. If the line jumps suddenly, try changing stabilization from Smart to Fast in Settings.'),
          sub('Part of the flight is missing'),
          p('The line stops early or never starts. The ball was lost against the sky, hidden by a tree, or too small and fast for those frames. Fill the gap with the landing point and arc in Trace golf, or with key points in Free curve.'),
        ],
      },
      {
        heading: 'Correct a golf arc and landing point',
        blocks: [
          p('In Trace golf you rarely need to start over. Two handles shape the whole line.'),
          steps([
            'Scroll the timeline to the frame where the ball lands and move the landing point onto it.',
            'Drag the diamond on the curve to raise, lower or bend the arc until it sits on the ball through the flight.',
            'If automatic tracking missed the ball entirely, choose to trace manually: place the start point on the ball, and Tracer draws a rough curve for you to shape with the landing point and diamond.',
            'Tap Preview and check the line against the ball from start to finish.',
          ]),
        ],
      },
      {
        heading: 'Repair a Free curve trace with key points',
        blocks: [
          p('Free curve draws a smooth line through key points. When it drifts, you add or move a point where it went wrong rather than redrawing everything.'),
          steps([
            'Scroll the timeline to the first frame where the line leaves the ball or disc.',
            'Zoom in with two fingers and move the cursor onto the ball or disc to add a key point there.',
            'Move forward to the next place it drifts and repeat. Points matter most where the flight bends.',
            'If a point is in the wrong place, move it rather than adding another right next to it.',
          ]),
          p('Start with the points where the line clearly leaves the ball or disc. Add others only where the line needs them.'),
        ],
      },
      {
        heading: 'Trim unwanted tracking',
        blocks: [
          p('When tracking picked up something that is not your ball or disc, resize the track in the timeline so it ends before the wrong object appears. Then finish the line with the landing point in Trace golf or a few key points in Free curve. Trimming is quicker than fighting a track that is following the wrong thing.'),
        ],
      },
      {
        heading: 'Preview the repaired section before saving',
        blocks: [
          p('Tap Preview and watch the part you repaired at least twice. Check that the line grows with the ball rather than ahead of it, that it does not wobble between points, and that it ends where the ball or disc lands. Then save to Photos.'),
          linked('For every button and gesture in both modes, see the full ', MANUAL_LINK, '.'),
        ],
      },
    ],
    settings: [
      { name: 'Mode', value: 'The mode the trace was made in', when: 'Repair a golf trace with the landing point and arc; repair a disc or putt trace with Free curve key points.' },
      STABILIZATION,
      { name: 'Key points', value: 'A few to start', when: 'Add more only where the line departs from the visible flight.' },
    ],
    troubleshooting: [
      {
        problem: 'The line wobbles between points',
        cause: 'Two key points may sit very close together.',
        fix: 'Move one of them so the points are spread along the flight.',
      },
      {
        problem: 'The line runs ahead of the ball',
        cause: 'A point is placed on the right spot but on the wrong frame.',
        fix: 'Scroll to the frame where the ball is really at that spot and move the point there.',
      },
      {
        problem: 'The line jumps when the camera pans',
        cause: 'Camera movement may have displaced the line.',
        fix: 'If stabilization is off, turn it on in Settings. If the line jumps with Smart, try Fast, and preview again.',
      },
      {
        problem: 'The ball cannot be seen in part of the clip',
        cause: 'The ball is not visible in those frames at all.',
        fix: 'Use the visible flight before and after the gap to guide a manual correction. The hidden section is an estimate. If the ball never reappears, avoid presenting an invented landing as observed flight.',
      },
    ],
    faqs: [
      { question: 'Do I have to start again?', answer: 'Usually not. Correct the existing arc, landing point or Free curve points first, in the mode your project is in.' },
      { question: 'Why does my golf ball trace stop in the wrong place?', answer: 'Tracking lost the ball or followed something else near the end. Move the landing point to where the ball really lands.' },
      { question: 'Can I switch a golf trace to Free curve?', answer: 'Free curve is a separate mode you start from the home screen. Open the same video there if you want to draw the flight with key points instead.' },
      { question: 'Which stabilization setting should I use?', answer: 'If the camera was still, you can speed things up by turning stabilization off. If the line is jumping suddenly, try changing from Smart to Fast.' },
    ],
    relatedSlugs: ['film-a-golf-ball-flight', 'film-a-disc-flight', 'trace-golf-video-without-tripod'],
    productLink: TRACER_LINK,
  },
  {
    slug: 'trace-golf-video-without-tripod',
    category: 'golf',
    title: 'How to trace a golf video without a tripod',
    pageTitle: 'Golf Ball Tracer Without a Tripod: Handheld iPhone Guide · SundayStroke',
    description: 'Film your golf swing handheld and still get a flight line that stays on the ball. How to hold the phone, keep the ball in view and correct a line that slips.',
    summary: 'Film handheld; the line stays in place when the camera moves.',
    intro: [
      'You may have a playing partner holding a phone on the tee, or a phone propped on your bag. The worry with a tracer is that the line slides around when the camera moves, because the picture moved but the line did not.',
      'SundayStroke Tracer keeps the line in place when the camera moves, so no tripod is required. This guide covers how to film handheld, how to review the part with the most movement, and what to do about a line that still slips. For import and export, see the main golf tutorial.',
    ],
    hero: null,
    clips: [GOLF_AFTER],
    sections: [
      {
        heading: 'What a moving camera means for the line',
        blocks: [
          p('A flight line is drawn over the video. If the phone tilts up as the ball climbs, the picture moves with it. Tracer keeps the line in place when that happens, which is why you do not need a tripod.'),
          p('You still make tracing easier with footage that is clear and reasonably steady, with the ball visible.'),
        ],
      },
      {
        heading: 'How to hold the phone for a handheld trace',
        blocks: [
          tips([
            'Hold the phone in both hands with your elbows tucked against your body. That helps reduce shake.',
            'Stand 3 to 4 meters (10 to 12 feet) behind the golfer on the target line, at about chest height.',
            'Plant your feet before the backswing starts.',
            'Lock focus and exposure by touching and holding on the golfer before you record, so the camera does not hunt when the ball leaves.',
            'Keep the 1x lens and do not zoom while recording. Zooming mid-clip changes the whole picture at once.',
          ]),
          sub('Following the ball'),
          p('Keep the phone still through impact. If the ball is about to leave the top of the frame, tilt up slowly and smoothly. A slow follow is fine; a fast whip can blur the ball and the background together.'),
          sub('Propping the phone instead'),
          p('No partner? Lean the phone against your bag, a range basket or a bench, angled up slightly so the flight fits in the frame. It will not be perfectly level and that is fine. If the phone stayed still, you can speed things up by turning stabilization off in Settings.'),
        ],
      },
      {
        heading: 'Review the line during camera movement',
        blocks: [
          p('No tripod is required: Tracer keeps the line in place when the camera moves. Review the section with the most movement. If the trace leaves the visible ball, correct the arc or landing point. A blurred or missing ball cannot be recovered from footage that never captured it clearly.'),
          p('Stabilization is in Tracer\'s Settings, with Smart, Fast and Off. If the line is jumping suddenly, try changing from Smart to Fast. If the camera was still, turning it off speeds things up.'),
        ],
      },
      {
        heading: 'Trace the handheld clip step by step',
        blocks: [
          steps([
            'Tap Trace golf and pick your video.',
            'Scroll to the frame just after impact and select the ball with the cursor.',
            'Let Tracer follow the ball, then tap Preview.',
            'Watch the line during the part where the camera moved most. If it jumps suddenly, try changing from Smart to Fast in Settings and preview again.',
            'Move the landing point or drag the diamond on the arc to finish, then save to Photos.',
          ]),
        ],
      },
      {
        heading: 'Realistic limits of handheld footage',
        blocks: [
          p('Tracer cannot bring back detail that was never recorded. If the phone swung so fast that everything blurred, or the ball left the frame for good, there is nothing to follow. You can shape that part by hand, but it is your drawing of the flight.'),
          linked('When a handheld trace needs a hand-made repair, ', { href: sitePath('/learn/fix-a-trace-by-hand/'), label: 'fix a missing or drifting tracer line' }, ' walks through each fix.'),
        ],
      },
    ],
    settings: [STABILIZATION, { name: 'Lens', value: '1x, no zoom while recording', when: 'Every handheld clip. The main lens is the sharpest and zooming mid-clip is hard to steady.' }, RENDER_3D, LINE_WIDTH],
    troubleshooting: [
      {
        problem: 'The line drifts as the camera follows the ball',
        cause: 'Camera movement, motion blur or lost tracking may have displaced the line.',
        fix: 'Correct the arc and landing point. If the line jumps suddenly, try changing stabilization from Smart to Fast in Settings and preview again.',
      },
      {
        problem: 'The line shakes even though the ball is clear',
        cause: 'Small, quick hand movement may be contributing.',
        fix: 'Try the other stabilization type in Settings and compare. Next time, tuck your elbows in and brace against something.',
      },
      {
        problem: 'Tracking picks up the wrong object while panning',
        cause: 'As the camera moved, a tree top or a bird passed where the ball was expected.',
        fix: 'Resize the track in the timeline to leave those frames out, then finish with the landing point.',
      },
      {
        problem: 'The ball is lost against the sky after the camera tilts up',
        cause: 'Tilting up puts the ball against bright sky with nothing behind it.',
        fix: 'Shape the rest of the arc with the diamond and set the landing point by hand. Tilt less next time, or stand further back so the flight fits without tilting.',
      },
    ],
    faqs: [
      { question: 'Do I need a tripod for a golf ball tracer?', answer: 'No. The line stays in place when the camera moves. Clear, reasonably steady footage still makes tracing easier.' },
      { question: 'Should I use iPhone Action mode?', answer: 'You do not need it for Tracer. Try normal video held in two hands first, and check a test clip if you want to compare.' },
      { question: 'Why does my tracer line jump when the camera moves?', answer: 'Check that stabilization is on in Settings. If the line is jumping suddenly, try changing from Smart to Fast, then correct the arc or landing point.' },
    ],
    relatedSlugs: ['film-a-golf-ball-flight', 'fix-a-trace-by-hand', 'trace-behind-trees'],
    productLink: TRACER_LINK,
  },
  {
    slug: 'trace-a-putt',
    category: 'golf',
    title: 'How to add a tracer line to a putting video',
    pageTitle: 'How to Add a Tracer to a Putting Video on iPhone · SundayStroke',
    description: 'Add a line to a putting video with Free curve. Place key points along the visible roll, refine the path and finish at the cup or stopping point.',
    summary: 'Draw the break of a putt into the cup with Free curve.',
    intro: [
      'For a golf putt, use Free curve and place key points on the rolling ball. Start where the ball begins moving, add points where the line misses the visible path, and finish where the ball stops or enters the cup.',
      'Automatic golf ball tracking is part of Trace golf, which follows a ball in flight, so a putt is drawn by hand in Free curve with a few key points. This guide covers the camera angle, the points to place and the finishing touches.',
    ],
    hero: null,
    clips: [],
    sections: [
      {
        heading: 'Why putts use Free curve',
        blocks: [
          p('Trace golf follows a ball in the air and draws an arc from the club to the landing point. A putt rolls along the green and may break sideways, so that arc does not describe it. Free curve draws a smooth line through key points you place on the ball, so the line can follow the visible roll.'),
        ],
      },
      {
        heading: 'Film the putt from the right angle',
        blocks: [
          sub('Behind the ball, on the line'),
          p('Crouch 1 to 2 meters behind the ball, phone held low, a little above knee height, looking down the line to the hole. Choose enough height to see the rolling path clearly, and remember that perspective affects how the break looks. Keep the cup in the frame for the whole roll.'),
          sub('Behind the hole, facing the golfer'),
          p('Standing behind the cup shows the golfer\'s stroke and the ball coming towards you. It is a good angle for short putts and holed-out celebrations, but the break can be harder to see because the ball rolls towards the camera.'),
          tips([
            'Keep your shadow and the golfer\'s shadow off the line.',
            'Lock focus and exposure on the ball before the stroke, so the camera does not refocus on the flag.',
            'Hold still. A putt is slow, so there is no need to follow the ball; keep the start and the cup both in view.',
            'Film the whole thing, from the stroke to the ball dropping or stopping.',
          ]),
        ],
      },
      {
        heading: 'Trace the putt step by step',
        blocks: [
          steps([
            'Open Tracer and tap Free curve on the home screen.',
            'Pick the putt from Photos.',
            'Scroll the timeline to the frame where the ball starts rolling and zoom in with two fingers.',
            'Move the cursor onto the ball to place the first key point.',
            'Scroll forward to the widest point of the break, where the ball is furthest from a straight line to the hole, and place a point on the ball.',
            'Scroll to the frame where the ball reaches the cup, or stops, and place the last point there.',
            'Tap Preview. Add one more point only if the line cuts a corner the ball did not.',
          ]),
          p('Start with a few points and add more only where the line misses the visible path. A long putt that breaks both ways may need more than a short, straight one.'),
        ],
      },
      {
        heading: 'Make the line end at the cup',
        blocks: [
          p('Put the final key point on the frame where the ball reaches the edge of the cup, not a frame later when it has already vanished. For a miss, end the line where the ball stops, so it shows exactly how far past or short it went.'),
          p('Preview the width so the line does not cover the cup or ball, and choose a color that stands out against green grass, such as white or the Floodlit line.'),
        ],
      },
      {
        heading: 'Use traced putts for practice',
        blocks: [
          p('Film several putts from the same fixed position and trace their visible paths. Compare start direction and finishing position. The video alone cannot tell you whether a miss came from aim, stroke, pace or the read, and perspective affects how the break looks.'),
        ],
      },
    ],
    settings: [
      { name: 'Mode', value: 'Free curve', when: 'Every putt, short or long.' },
      { name: 'Key points', value: 'A few to start', when: 'Start, any clear change in the roll, and finish; add more only where the line misses the ball.' },
      { name: 'Line width', value: 'Adjust to suit the clip', when: 'The line should not cover the ball or the cup.' },
      { name: 'Stabilization', value: 'Smart, Fast or Off', when: 'If the phone was still, turning it off speeds things up.' },
    ],
    troubleshooting: [
      {
        problem: 'The line cuts across the break',
        cause: 'There is no point at the widest part of the curve.',
        fix: 'Scroll to the frame where the ball is furthest from a straight line and add a key point on the ball.',
      },
      {
        problem: 'The line overshoots the hole',
        cause: 'The last point is on a frame after the ball dropped.',
        fix: 'Move the last point to the frame where the ball reaches the edge of the cup.',
      },
      {
        problem: 'The ball is hard to see on the green',
        cause: 'A shadow or a low angle into the sun hides the white ball.',
        fix: 'Zoom in with two fingers to place points. Next time, film with the sun behind you or to the side.',
      },
      {
        problem: 'The line is shaky',
        cause: 'The phone moved slightly while you crouched.',
        fix: 'If the line jumps suddenly, try changing stabilization from Smart to Fast and preview again. Next time, rest your elbows on your knees when filming.',
      },
    ],
    faqs: [
      { question: 'Can Tracer follow a putt on its own?', answer: 'Automatic golf ball tracking is part of Trace golf, which is built for balls in the air. For putts, place a few key points in Free curve.' },
      { question: 'What is the best angle to film a putt?', answer: 'Film from behind the ball with the start and cup visible. Choose enough height to see the rolling path clearly. Keep the camera position consistent when comparing putts.' },
      { question: 'Does it work for disc golf putts?', answer: 'Yes. Disc putts use Free curve too, and Tracer can follow a disc after you select it at release.' },
      { question: 'Can I add how long the putt was?', answer: 'Yes, with Premium. You type a distance and a counter runs up during the roll. See the guide to adding a distance label.' },
    ],
    relatedSlugs: ['fix-a-trace-by-hand', 'add-distance-label-to-golf-video', 'film-a-golf-ball-flight'],
    productLink: TRACER_LINK,
  },
  {
    slug: 'add-tracer-to-disc-golf-video',
    category: 'disc-golf',
    title: 'How to Film Disc Golf on iPhone When Playing Solo',
    pageTitle: 'How to Film Disc Golf on iPhone When Playing Solo · SundayStroke',
    description: 'Position your iPhone and film a useful disc golf clip on your own: where to prop the phone for drives, approaches and putts, then trace it and share.',
    summary: 'Position your iPhone and capture a useful clip before editing.',
    intro: [
      'Film, trace and share a disc golf throw using your iPhone. This guide focuses on camera placement and filming on your own. For detailed Free curve editing steps, use the disc flight tracing tutorial.',
      'Below is a finished trace from the app.',
    ],
    hero: { src: '/media/learn/disc-golf-flight.jpg', alt: 'A disc golf throw in Tracer with the whole flight drawn from release to landing', caption: 'A finished trace: the whole disc flight, from release to landing', width: 601, height: 1036 },
    clips: [DISC_AFTER],
    sections: [
      {
        heading: 'Where to put the phone for each throw',
        blocks: [
          sub('Drives: behind the thrower'),
          p('Stand or prop the phone 3 to 5 meters behind the tee pad, a step to the side of the run-up so the body does not hide the release. Hold it at chest height and leave the top half of the frame for the flight.'),
          sub('Approaches and upshots: from the side'),
          p('For an approach, choose a side angle that shows the flight while keeping you and the phone outside the intended landing area and likely misses. The best position depends on the hole and the throw. Keep the basket in the frame if you can.'),
          sub('Putts: behind the putter or beside the basket'),
          p('Behind the putter at waist height shows the line to the basket. Beside the basket, 2 to 3 meters off to one side, catches the disc hitting chains. Either way, keep both the release and the basket in the frame for the whole putt.'),
        ],
      },
      {
        heading: 'Filming on your own',
        blocks: [
          
          tips([
            'Lean the phone against your bag or cart, angled up so the flight fits, and check the framing before you walk to the tee.',
            'Start recording, then throw. Trim the extra seconds later in Photos.',
            'Use the 1x lens; 0.5x makes the disc a speck in the air.',
            'Touch and hold on the tee pad to lock focus and exposure.',
            'Throw a bright disc. Orange, pink, yellow and lime stand out against trees; white and grey plastic disappear against cloud.',
          ]),
          p('With a friend filming: both hands, elbows tucked, still for the release, then a slow follow if the disc heads out of frame.'),
        ],
      },
      {
        heading: 'Camera settings for disc flights',
        blocks: [
          tips([
            'In good light, try normal video at 60 frames per second for a drive. Review the disc\'s visibility before filming more throws; a higher frame rate alone does not guarantee sharper footage.',
            'Slo-mo at 120 or 240 frames per second makes a whole drive take a long time to play, so keep it for putts and short approaches.',
            'Film upright for stories and reels, sideways for long drives that cross the frame.',
          ]),
        ],
      },
      {
        heading: 'Trace the flight in Free curve',
        blocks: [
          steps([
            'Open Tracer and tap Free curve.',
            'Pick the throw from Photos.',
            'Scroll the timeline to the frame just after release, when the disc is clear of the hand.',
            'Zoom in with two fingers and move the cursor onto the disc to select it.',
            'Let Tracer follow the disc, then tap Preview.',
            'Where the line drifts off the disc, add or move a key point on the disc in that frame.',
            'Choose a line style and save the video to Photos.',
          ]),
          linked('For more on correcting the line, see ', { href: sitePath('/learn/film-a-disc-flight/'), label: 'how to trace a disc golf flight' }, '.'),
        ],
      },
      {
        heading: 'Make it look good on a phone screen',
        blocks: [
          tips([
            'Pick a line color that contrasts with the background: the Floodlit line or white against dark trees, a strong color against a bright sky.',
            'Try the 3D look, and preview the width on your phone.',
            'With Premium, you can add a gradient, a tail length or a landing effect.',
            'Keep it short: a second before the throw and a beat after the landing.',
          ]),
        ],
      },
      {
        heading: 'Share the clip',
        blocks: [
          p('Tracer saves the finished video to Photos, so you post it from there to any app you like. Free saves carry a small watermark; Premium saves have none. Add who threw it, the hole and the disc in your caption.'),
        ],
      },
    ],
    settings: [
      { name: 'Mode', value: 'Free curve', when: 'Every disc throw.' },
      { name: 'Frame rate', value: '60 frames per second to start', when: 'In good light, for drives and long approaches. Check a test clip.' },
      STABILIZATION,
      RENDER_3D,
    ],
    troubleshooting: [
      {
        problem: 'The line drifts in the turn',
        cause: 'The disc changes direction and shrinks as it flies away.',
        fix: 'Add a key point on the disc at the frame where the line leaves it.',
      },
      {
        problem: 'Tracking follows a bird or a branch',
        cause: 'Something moved across the disc\'s path.',
        fix: 'Add or move key points on the disc through that part of the flight.',
      },
      {
        problem: 'The disc vanishes against white cloud',
        cause: 'A pale disc against a pale sky has no contrast.',
        fix: 'Place key points by hand where you can still make it out. Throw a brighter disc or film from a lower angle with trees behind the flight.',
      },
      {
        problem: 'The line jumps when the friend filming moved',
        cause: 'Camera movement may have displaced the line.',
        fix: 'Try changing stabilization from Smart to Fast in Settings, preview again, and correct with key points.',
      },
    ],
    faqs: [
      { question: 'Can I make a disc golf flight tracer with just my phone?', answer: 'Yes. Film on your iPhone, trace in Tracer\'s Free curve mode and save to Photos. No computer or desktop editing software is needed.' },
      { question: 'Does Tracer follow the disc automatically?', answer: 'Yes, in Free curve, after you select the disc at release. You add or move key points by hand wherever the line drifts.' },
      { question: 'Where should I stand to film a drive?', answer: '3 to 5 meters behind the tee pad, a step to the side of the run-up, at about chest height.' },
      { question: 'Can I trace an old clip?', answer: 'Yes, you pick the video from Photos. It works best when you can see the disc leave the hand.' },
    ],
    relatedSlugs: ['film-a-disc-flight', 'trace-behind-trees', 'fix-a-trace-by-hand'],
    productLink: DISC_LINK,
  },
  {
    slug: 'add-distance-label-to-golf-video',
    category: 'editing',
    title: 'How to add a distance label to a golf video',
    pageTitle: 'Add a Yardage or Distance Label to a Golf Video · SundayStroke',
    description: 'Add a distance counter to your traced golf or disc golf video. Where the number comes from, how to type it in Tracer, and how the counter runs with the flight.',
    summary: 'Type the distance; a counter runs up to it during the flight.',
    intro: [
      'A number on screen makes a clip: 287 on a drive, 142 on a seven-iron that finished by the pin. SundayStroke Tracer Premium lets you add a distance label to a traced flight. You type the distance in Effects, under Distance, and a counter runs up during the flight.',
      'The important part is where the number comes from. Tracer does not work out how far a shot went. The label shows what you type, so this guide covers where to get a number, how to add it, and how to make it read well.',
    ],
    hero: null,
    clips: [GOLF_AFTER],
    sections: [
      {
        heading: 'Where the distance comes from',
        blocks: [
          p('A video alone does not say how far a ball flew. Use a distance measured separately from Tracer. A launch monitor may report carry and total, although total can be modeled. A GPS app can estimate how far the finishing position is from the starting position; that does not identify carry unless the landing point is known. A laser needs a visible, reliable target. For a short putt, use a tape, or label a paced length as approximate.'),
          linked('If you already play with ', GOLF_GPS_LINK, ' Pro, marking the shot during the round gives you a number to type in later.'),
        ],
      },
      {
        heading: 'Add the distance label step by step',
        blocks: [
          steps([
            'Trace the golf ball or disc flight and review the line.',
            'Open Text > Distance and type the distance.',
            'Preview the counter as it runs up during the flight.',
            'Save the finished video to Photos.',
          ]),
          p('Check that the count finishes where you expect. If it looks too early or too late, move the landing point to the frame where the ball really lands and preview again.'),
        ],
      },
      {
        heading: 'Yards or meters, carry or total',
        blocks: [
          p('The distance editor lets you choose feet, meters, yards or no unit. Use the one your audience uses and stay consistent across a series of clips.'),
          p('Decide too whether you are showing carry, how far the ball flew in the air, or total, including the roll. State the unit and whether the number is carry or total distance in your caption. For example: "Carry: 142 yards, measured separately."'),
        ],
      },
      {
        heading: 'Choosing a number for different clips',
        blocks: [
          tips([
            'On the range, a launch monitor reading is the simplest source. Check whether the figure you are typing is carry or total.',
            'On the course, a GPS distance from where you hit to where the ball finished is closer to total than carry, so say so.',
            'For a disc throw, a GPS distance or a paced distance from the tee pad to where the disc finished works the same way. Label a paced number as approximate.',
            'For a series of clips, use the same source each time, so the numbers can be compared fairly.',
          ]),
        ],
      },
      {
        heading: 'Make the label read well',
        blocks: [
          tips([
            'Round the number. 287 reads better than 286.6.',
            'Keep the clip long enough after landing for the final number to sit on screen for a moment.',
            'Pick a line color that also leaves the label easy to read against the background.',
            'For putts, a distance label works too: type the length of the putt, measured or labelled as approximate if you paced it.',
          ]),
        ],
      },
      {
        heading: 'Be honest with the number',
        blocks: [
          p('A distance label is a caption, not a measurement. If you guessed, the label is a guess. If you are posting a long drive, say where the number came from.'),
        ],
      },
    ],
    settings: [
      { name: 'Distance label', value: 'On, with the distance you typed', when: 'Any clip where the number is the point: drives, approaches, holed putts.' },
      { name: 'Units', value: 'Feet, meters, yards or none', when: 'Stay consistent across a series of clips.' },
      { name: 'Landing point', value: 'On the frame the ball lands', when: 'The count finishes where the line finishes.' },
    ],
    troubleshooting: [
      {
        problem: 'The count finishes before the ball lands',
        cause: 'The line ends early, so the counter does too.',
        fix: 'Move the landing point, or the last key point in Free curve, to the frame where the ball really lands.',
      },
      {
        problem: 'The number looks wrong on screen',
        cause: 'A typo, or a total typed where carry was meant.',
        fix: 'Open the label again, retype the number and preview.',
      },
      {
        problem: 'The label is hard to read',
        cause: 'It sits over a bright sky or a busy background.',
        fix: 'Try a different line color or style, and preview against the brightest part of the clip.',
      },
    ],
    faqs: [
      { question: 'Does Tracer measure how far my shot went?', answer: 'No. You type the distance, and a counter runs up during the flight. Use a number you measured separately.' },
      { question: 'How do I know how far my drive went?', answer: 'A launch monitor may report carry and total, although total can be modeled. On the course, a GPS app can estimate the distance from start to finish; that is not carry unless the landing point is known.' },
      { question: 'Can I add a distance label to a disc golf throw?', answer: 'Yes. Trace the throw in Free curve, then add the label and type the distance.' },
      { question: 'Can I change the number after saving?', answer: 'Edit the trace again, retype the number and save a new video.' },
    ],
    relatedSlugs: ['film-a-golf-ball-flight', 'trace-a-putt', 'trace-behind-trees'],
    productLink: TRACER_LINK,
  },
  {
    slug: 'trace-behind-trees',
    category: 'editing',
    title: 'How to show a ball or disc flight behind trees',
    pageTitle: 'Show a Tracer Line Behind Trees and Obstacles · SundayStroke',
    description: 'Hide part of your flight line behind trees, poles and players with Color segments, and how to handle the frames the camera could not see.',
    summary: 'Hide the line behind an obstacle and handle the unseen part.',
    intro: [
      'A flight line drawn straight across a tree looks wrong. The eye knows the ball went behind the branches, so a line painted over them breaks the effect. In SundayStroke Tracer Premium, Style > Color segments with the clear style makes a section of the line transparent, to show the flight behind trees, poles and people.',
      'This guide covers when to use it, how to get it right, and the honest limit: the camera never saw the ball behind the tree, so any line through that part is an estimate.',
    ],
    hero: null,
    clips: [DISC_AFTER],
    sections: [
      {
        heading: 'When the flight goes behind something',
        blocks: [
          p('Three situations come up again and again:'),
          tips([
            'Disc golf drives through a wooded fairway, where the disc passes behind trunks and branches.',
            'Golf shots that curve round or over a tree line, filmed from behind the golfer.',
            'Anything with a person, flagstick, pole or net between the camera and part of the flight.',
          ]),
          p('In each case the clip looks best when the obstacle stays in front of the line for the frames where it was really in front of the ball.'),
        ],
      },
      {
        heading: 'Trace the visible flight first',
        blocks: [
          p('Get the line right where you can see the ball or disc before dealing with the hidden part.'),
          steps([
            'Trace the shot in Trace golf, or the throw in Free curve.',
            'Make sure the line meets the ball or disc where it goes behind the obstacle and where it comes out again. In Free curve, place a key point on each of those two frames.',
            'Shape the line between those two points so it follows a believable path: the same curve the flight had before and after.',
            'Preview and check the line joins up smoothly on both sides of the obstacle.',
          ]),
        ],
      },
      {
        heading: 'Keep the obstacle in front of the line',
        blocks: [
          p('With the line in place, open Style, tap Color segments, mark the section that passes behind the obstacle and give it the clear style, so that part of the line turns transparent. The tree or pole then appears in front, and the line picks up again on the other side.'),
          tips([
            'Start the hidden section exactly where the ball goes behind the obstacle, and end it where it comes out. A few frames off and the line pops out of the trunk.',
            'Scrub through those frames slowly to check the edges.',
            'For a thin branch or a pole, a short transparent section reads better than a long one.',
            'For a whole stand of trees, hiding the line in that section and letting it reappear past the trees tells the story clearly.',
          ]),
        ],
      },
      {
        heading: 'What the camera could not see',
        blocks: [
          p('The camera does not show the flight while the ball or disc is hidden. It may curve, strike a branch or deflect out of view, so a smooth join between the visible sections is only an estimate. Do not present that join as a measured path.'),
          p('If the ball or disc never comes back into view, for example a drive that disappears into the woods, end the line where it went out of sight. Inventing a landing you did not see is the quickest way to make a clip look fake.'),
        ],
      },
      {
        heading: 'Fix timing around the obstacle',
        blocks: [
          p('If the line seems to jump when the ball reappears, the point after the obstacle is on the wrong frame. Scroll to the first frame where the ball is clearly visible again and move the point there. If the line runs ahead behind the tree, move the point on the frame where the ball disappeared.'),
          linked('More repair steps are in ', { href: sitePath('/learn/fix-a-trace-by-hand/'), label: 'fix a missing or drifting tracer line' }, '.'),
        ],
      },
    ],
    settings: [
      { name: 'Mode', value: 'Trace golf or Free curve, as for the shot', when: 'Obstacle handling works on the line you already traced.' },
      { name: 'Hidden section', value: 'From the frame the ball goes behind to the frame it comes out', when: 'Trees, poles, players and nets between the camera and the flight.' },
      { name: 'Key points', value: 'One on each side of the obstacle', when: 'In Free curve, so the line joins up where the flight reappears.' },
    ],
    troubleshooting: [
      {
        problem: 'The line pops out of the tree trunk',
        cause: 'The hidden section starts or ends a few frames off.',
        fix: 'Scrub through those frames slowly and line up the start and end of the hidden section with the trunk.',
      },
      {
        problem: 'The line jumps where the ball reappears',
        cause: 'The point after the obstacle is on the wrong frame.',
        fix: 'Move it to the first frame where the ball is clearly visible again.',
      },
      {
        problem: 'Tracking followed a branch',
        cause: 'Moving leaves near the flight looked like the ball or disc.',
        fix: 'Correct the arc and landing point in Trace golf, or add or move key points in Free curve.',
      },
      {
        problem: 'The flight never comes back into view',
        cause: 'The ball or disc went out of sight and stayed there.',
        fix: 'End the line where it disappeared rather than guessing a landing.',
      },
    ],
    faqs: [
      { question: 'Can Tracer trace a disc hidden by a tree?', answer: 'You can hide the section of the line that passes behind an obstacle using Style > Color segments and the clear style. Any flight drawn through an unseen section is your estimate.' },
      { question: 'Can I make only part of the line transparent?', answer: 'Yes. With Premium, Style > Color segments and the clear style make a section of the line transparent.' },
      { question: 'Does it work when the camera moved?', answer: 'Yes. The line stays in place when the camera moves. Check the hidden section\'s edges with Preview after any big camera movement.' },
      { question: 'Does it work for golf and disc golf?', answer: 'Yes. Obstacle handling works on the traced line in either mode.' },
    ],
    relatedSlugs: ['fix-a-trace-by-hand', 'add-tracer-to-disc-golf-video', 'film-a-disc-flight'],
    productLink: TRACER_LINK,
  },
];

export function tutorialBySlug(slug: string): Tutorial {
  const found: Tutorial | undefined = TUTORIALS.find((tutorial) => tutorial.slug === slug);
  if (found === undefined) throw new Error(`Unknown tutorial: ${slug}`);
  return found;
}

export function relatedTutorials(tutorial: Tutorial): readonly Tutorial[] {
  return tutorial.relatedSlugs.map(tutorialBySlug);
}

export function tutorialsIn(category: TutorialCategory): readonly Tutorial[] {
  return TUTORIALS.filter((tutorial) => tutorial.category === category);
}
