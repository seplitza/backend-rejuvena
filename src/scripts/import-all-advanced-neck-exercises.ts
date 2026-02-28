import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exercise from '../models/Exercise.model';
import Tag from '../models/Tag.model';
import { getEnTag } from './utils/en-tag';
import { getRuTag } from './utils/ru-tag';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';

// Данные из вашего JSON - все упражнения курса "+Advanced for the Neck"
const COURSE_DATA = {
  marathonId: 'fc62d140-17af-4c61-be90-63a6cc656a7b',
  title: '+Advanced for the Neck',
  dayCategories: [
    {
      categoryName: 'Lymphatic drainage',
      order: 4,
      exercises: [
        {
          exerciseName: 'Lymph jumps',
          exerciseDescription: '<p><strong>Lymphatic drainage jumping</strong></p><p>We promote the lymphatic flow and boost our metabolism in this exercise. Jumping can be replaced by running in place.<br>The best time for this exercise is in the morning when you just woke up and still did not even have a glass of water or so.</p><p>What does this jump-the-lymph-exercise give us?<br>- Lymphatic system receives support in cleansing from cell waste;<br>- The body is mobilized, the metabolism is accelerated;<br>- It is the number-one-treatment for skin laxity;<br>- Cellulite is reduced;<br>- Excess fluid is slowly removed, which results in reduction of edemas and all the edematous congestion.</p><p><strong>Caution:</strong> The course is designed for conventionally healthy people. If you have any chronic medical conditions or have recently had a surgery, please do not jump.<br>Pregnant women should also not jump.</p><p>Ladies, hold your breast while jumping.<br>If you are overweight, you should start with easy jumping, which means a low jumping height and a lower number of jumps. You can increase the height and the number, when you feel like it.</p><p><strong>Technique</strong><br>- Find a free space with a solid floor.<br>- Go on your tiptoes and let your body weight fall naturally on your heels. Continue these jumps, gradually increasing the jumping height and the speed.<br>- Do about 30 to 40 jumps the first time. You can gradually increase the number of jumps up to 100 on the following days of practice.</p><p><strong>Important!</strong><br>Do not lift your toes off the floor, it is not necessary to bounce, but to hit the floor with your heels. The floor still can shake. Be sure to choose a solid floor. <span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f609.svg);">&nbsp;</span>&nbsp;</p><p>If you have swelling in your entire body, you can repeat this jumping exercise in the afternoon and in the evening, but not later than 1 hour before going to bed. These jumps are pretty invigorating. <span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f609.svg);">&nbsp;</span>&nbsp;</p><p>Listen to your body. Your sensations will tell you the correct jumping height and speed. The main rule in this business is regularity, not intensity.</p><p><em>Good luck!</em><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f60c.svg);">&nbsp;</span>&nbsp;</p>',
          marathonExerciseName: 'up to 100',
          order: 1,
          exerciseContents: [
            { type: 'image', contentPath: 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/BeautifyManContent/Images/a0b85e7c-c0b2-46ed-a007-9eb06504fb1c.gif', order: 1, isActive: true },
            { type: 'video', contentPath: 'https://player.vimeo.com/video/515119475', order: 2, isActive: true },
            { type: 'image', contentPath: 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/BeautifyManContent/Images/ccd2ad5c-c886-4f5c-ad7b-0a1a498f65f8.png', order: 3, isActive: true }
          ]
        },
        {
          exerciseName: 'Running',
          exerciseDescription: '<p><strong>Running in place</strong></p><p>Shake it up!<br>This lymph drainage exercise can be substituted by jumping.<br>- Lymphatic system is cleansed from toxins.<br>- The whole body is mobilized.<br>- First cure for skin laxity.<br>- Cellulite is reduced.<br>- Excess fluid slowly goes away, which helps to get rid of edema and other edema related problems.</p><p><strong>Caution:</strong> This kind of running is no sport! Our goal is to get our bodies to start vibrating to improve the &nbsp;blood circulation from blood vessels to capillaries. So, you normally shouldn&rsquo;t feel tired afterwards.&nbsp;</p><p><strong>Technique</strong><br>Find a suitable spot where you can move freely in one place.<br>Simply start running in place. No need in big or sharp movements. It is much more important to slightly hop from one foot to another. That is the minimum you should try to perform. You can add some movements to your arms, too, if you want to boost the effect. Keep running for about a minute. Breathe evenly.&nbsp;</p><p><strong>Attention!</strong><br>Do not tense any part of your body. Relax your shoulders, arms and hands. Shake them up, if you feel like doing this!</p><p><em>Take it easily!&nbsp;<span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f609.svg);">&nbsp;</span>&nbsp;</em></p>',
          marathonExerciseName: 'about a minute',
          order: 2,
          exerciseContents: [
            { type: 'image', contentPath: 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/BeautifyManContent/Images/64acfe21-7f03-46d4-84d7-6cc2f367728f.gif', order: 1, isActive: true },
            { type: 'video', contentPath: 'https://player.vimeo.com/video/521362084', order: 2, isActive: true }
          ]
        },
        {
          exerciseName: 'Lymphatic drainage of face',
          exerciseDescription: '<p><strong>Morning lymphatic face drainage</strong></p><p>We always start working on the face with the lymphatic drainage techniques. At first, we perform the lymphatic drainage &ndash; the cleansing and only after that the manual tricks.</p><p>As a result of this lymphatic drainage technique:<br><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span> Facial volume decreases;<br><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span>&nbsp; The lymphatic transport system is refreshed, and healthy face lymph drainage is normalized;<br><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span>&nbsp; Cell decay products are removed faster;<br><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span>&nbsp; Skin appearance is improved due to a faster lymph cleansing;<br><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span>&nbsp; Pigmented spots are lightened;<br><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span>&nbsp; The skin elasticity is increased by getting rid of excess fluid.</p><p><strong>Caution: &nbsp;</strong>Please do not stretch the skin. The main movement is more of a sliding. The pressure should be very light, it is rather stroking.<br>If you have a skinny face, do this exercise only in the morning, not more than 3 repetitions at a time.<br>Be sure to use some skin moisturizer for this technique. Perform the exercise either on moist skin or ideally after applying a day cream or tonic.&nbsp;</p><p><strong>Technique</strong><br>- You will need your both hands for this technique. Place the inner edge of your palms on the sides of your nose. The knuckles of your index fingers should be placed at the corners of your lips. The thumbs should meet under the chin area. Press the muscle under your chin with your thumbs before you start the motion.<br>- Slightly slide over your face with the inner edges of the palms towards the ears.<br>- When you reach your ears with the index fingers, run the fingers from the ears down the neck to the collarbones. After you reach the collarbones, on the exhalation, press in your fingers under the collarbone for 1 to 2 seconds.<br>- Repeat the exercise 2 to 3 times. You can perform the exercise up to 5 times, if you feel like it.</p><p><strong>Attention!</strong><br>You are probably asking yourself: Will I not stretch my skin too much?... <span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f631.svg);">&nbsp;</span><br>Don&rsquo;t worry, your skin will not stretch too much!<br>Do not forget about moisturizing and smoothing your face, and you will never have to ask yourself this question during the practice again.</p><p>If you have a full face, and you feel like it, repeat the exercise in the evening.<br>Observe the reaction of your face, and listen to your sensations.</p><p>Check out the 2nd video to see what your lymphatic system of the head and neck look like. <span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f44c.svg);">&nbsp;</span>&nbsp;</p><p><em>Good luck!&nbsp;</em><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f60c.svg);">&nbsp;</span>&nbsp;</p>',
          marathonExerciseName: '3-5 strokes',
          order: 3,
          exerciseContents: [
            { type: 'image', contentPath: 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/BeautifyManContent/Images/df23dc5a-3b76-46e8-951e-bd6d80897b6c.gif', order: 1, isActive: true },
            { type: 'video', contentPath: 'https://player.vimeo.com/video/515119462', order: 2, isActive: true },
            { type: 'video', contentPath: 'https://player.vimeo.com/video/541220602', order: 3, isActive: true }
          ]
        }
      ]
    },
    {
      categoryName: 'Advanced for the Neck',
      order: 10,
      exercises: [
        {
          exerciseName: 'Head rotations with emphasis on stretching',
          exerciseDescription: '<p><strong>Head rotation with emphasis on stretching<br></strong>I hope that the basic set of neck exercises has already become a habit for you, you do it in the morning every day and now your neck is already sufficiently prepared for more advanced exercises.<span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f44f.svg);">&nbsp;</span><br>We are going to learn a very effective advanced technique, whereby:<br>- the neck will become longer and smoother,<br>- the neck muscles will lengthen and relax, release the blood and lymph vessels,<br>- chronic pain in the neck, feeling of heaviness and fatigue will go away,<br>- the state of health, complexion, edema will improve.</p><p>Technique:<br>Previously, we did rotations at maximum amplitude, working with the whole neck, we rotated all the vertebrae up to the 7th. Now we are trying to keep the 4-7 cervical vertebrae upright, and rotate only the upper 1-3 vertebrae.<br>We stretch the top of our head up!&nbsp;<span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f446.svg);">&nbsp;</span><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f4aa.svg);">&nbsp;</span><br>After we stretch the neck upward as much as possible, we begin to rotate our head at a very small amplitude, paying all attention to exactly stretching the muscles. The greatest stretch should be felt in the upper part of the neck, where the muscles are attached. We rotate very slowly, and feel how each muscle is stretched.<br>In some places, you can stop and pull harder and longer if you feel it is necessary.<br>We do 5 slow rotations in one direction, and then 5 in the other.<br>Perhaps you will hear the crunching of the vertebrae again. If it is not accompanied by pain, this is a variant of the norm. With regular exercise, the crunch will come to naught.</p><p>Attention!<br>The main thing is not to overdo it! There should be no tearing, sharp pain or tension that you want to stop as soon as possible. The stretch should be strong enough, but enjoyable. The muscles of the back of the neck, platysma, sternocleidomastoid muscle (SCM), small muscles under SCM should be properly stretched.</p>',
          marathonExerciseName: '5 times each direction',
          order: 1,
          exerciseContents: [
            { type: 'image', contentPath: 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/BeautifyManContent/Images/e611dfb8-4e96-4b01-afee-ce6aabdefad0.gif', order: 1, isActive: true },
            { type: 'video', contentPath: 'https://player.vimeo.com/video/581755364', order: 2, isActive: true }
          ]
        },
        {
          exerciseName: 'Fibers separation of the back of the neck',
          exerciseDescription: '<p><strong>Fibers separation of the back of the neck</strong><br>The muscles in the back of the neck often build up residual spasm. This is due to our habit of keeping our head pointed forward or bowed over gadgets. This technique is aimed at relaxing the muscles of the back of the neck, returning them to a physiological position. Thereby:</p><p><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span> Chronic pain of tension in the neck disappears,</p><p><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span> Pain in the back of the head caused by nervous tension or fatigue often goes away,</p><p><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span> The neck becomes smoother, develops a good habit of carrying the head proudly and straight,&nbsp;</p><p><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span> Improves blood circulation and lymph flow in the tissues of the neck and face.</p><p><strong>Attention!</strong><br>It is almost impossible to harm yourself with this technique, even the deepest massage will only benefit, but keep in mind two important nuances.<br>First, the painful sensations during dispersion are quite normal. Areas of fibrosis can be painful. Do not spare yourself, but you do not need to try to stretch the &quot;stuck&quot; areas at any cost also. In this case, your guideline will be a pleasant, tolerable pain.<br>Second: the muscles may ache a little after such massage. This is the norm. You can relieve discomfort with a warm bath or compress.</p><p><strong>Technique:</strong><br>Keep your neck straight, point the top of your head upwards.<br>We need to unravel, disperse all the muscles in the back of the neck from the base of the skull to the weaving of the neck muscles into the trapezius muscles. We poke our fingers deep into the muscles and begin to pound them quite intensively. It is important not just to move the skin, but to grab the deep layers of the muscles. Try to feel the vertebrae with your fingertips and spread the muscles from the center to the periphery. Imagine that you are a sculptor who needs to sculpt the perfect neck.</p><p>Slowly move down, the deeper you work the muscles, the better result you can get.<br>Finger movements can be variable. Try circular kneading, pushing, grinding movements. You can squeeze the fold, hold it in your fingers for a few seconds and slowly release it.</p><p>Finish any rubbing movements with smoothing ones.</p><p>Pay special attention to the points behind the ears where the muscles attach to the base of the skull. This is the most likely area for fibrosis to form. Massaging this area can be especially painful at first. With practice, the pain will go away and only the most pleasant sensations will remain. Squeeze painful points with a smooth motion of your thumbs. Do not forget to work out a little the area in the corners of the jaw at the point of attachment of the SCSM.</p><p>Share your feelings in the comments. <span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f64f.svg);">&nbsp;</span>&nbsp;</p><p>Everything worked out? Are there any particularly painful spots?&nbsp;</p>',
          marathonExerciseName: '2-3 minutes',
          order: 2,
          exerciseContents: [
            { type: 'image', contentPath: 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/BeautifyManContent/Images/78723ef7-1e48-431a-b921-152cb2b4f6aa.gif', order: 1, isActive: true },
            { type: 'video', contentPath: 'https://player.vimeo.com/video/581755334', order: 2, isActive: true }
          ]
        },
        {
          exerciseName: 'SCM massage',
          exerciseDescription: '<p><strong>Massage and modeling of SCM (Sternocleidomastoid muscle)</strong><br>Spasm of the sternocleidomastoid muscle leads to shortening of the neck, its thickening, the formation of folds and a double chin. This technique will not only relax the SCM, but will also help return them to their physiological position, due to that:<br>- the relief of the neck will become beautiful as in youth<br>- neck static will level out<br>- the oval of the face will begin to tighten<br>- wrinkles and folds on the neck will be smoothed</p><p><strong>Pay attention!</strong><br>SCM massage can be painful. Probably, you will find such points from which you want to jump from the sharp pain and sparks will spray out of your eyes. Chronic spasm hurts! If you find such a point, do not abandon it and do not avoid massage in this area. Stay in the most painful place, breathe deeply. The pain will go away and relief and relaxation will come.</p><p><strong>Technique:</strong><br><strong>1 action. Find the sternocleidomastoid muscle.</strong><br>To do this, we tilt our head forward and turn it slightly to the side. The muscle will immediately appear. If a muscle is in a spasm, it will stand out in a separate array.<br><strong>2 action. Kneading.</strong> Each side separately.<br>We grab the SCSM with our fingers at the place it is attached to the scull and begin to knead it along the entire length. We grab the muscle, lift it a little bit and linger for about five seconds, then release it smoothly.<br>Next, move your fingers down the muscle. We work it out from top to bottom, and then return with kneading movements from bottom to top. Try not to just knead the muscle, but also stretch it a little when you finish kneading. To do this on return, fix the muscle with your other hand bellow the massaging point.<br>It is important to work with the muscle itself, not with the skin. Try to grab the tissues deeper.<br>Do massage on both sides of the neck.<br><strong>3 action. Modeling.</strong> Both sides together.<br>Grab the muscles tightly at the base, where they are attached to the scull, and gently pull them backward. Pull and hold for about 20 seconds or 4 deep inhale-exhale rounds. Then let them go slowly.</p><p>Personal experience!<br>A close friend of mine suffered from pain in the heart area for a long time. The stabbing and shooting pains under the scapula were so strong that a couple of times he called an ambulance for himself, fearing a heart attack. However, when examined by a cardiologist, no abnormalities in the heart were found. My friend visited several doctors and could not understand in any way why all the tests and examinations were normal, and the attacks were repeated and were so strong that it darkened in his eyes.<br>He began to practice massage and SCSM modelling in order to relax his neck and look younger. Once during the massage, he came across a point, pressing on which caused the strongest pain shooting under the scapula. It wasn&#39;t about the heart! The spasmodic SCSM squeezed one of the nerves! After several days of massage, the attacks stopped and never returned.<br>I hope this story has convinced you to pay attention to doing this technique well!</p><p>Good luck!<span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f64f.svg);">&nbsp;</span>&nbsp;</p>',
          marathonExerciseName: '1-2 minutes each side',
          order: 3,
          exerciseContents: [
            { type: 'image', contentPath: 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/BeautifyManContent/Images/6e6cfd75-0c35-4551-aa81-a5c2a0befba1.gif', order: 1, isActive: true },
            { type: 'video', contentPath: 'https://player.vimeo.com/video/581755382', order: 2, isActive: true }
          ]
        },
        {
          exerciseName: 'Deep sliding palpation',
          exerciseDescription: '<p><strong>Deep sliding palpation</strong></p><p>Under the large SCSM muscle, there are many more small muscles that support the neck. They are also prone to spasms and affect our well-being, neck static, blood and lymph flow. Without working out these small deep muscles, we will not see a healthy fresh complexion and an even neck.<br>To get to them, we will make deep sliding massaging movements. It is very important to create such pressure so that the brain receives an additional signal of muscle overstrain and gives a return signal for relaxation. Thus, we get rid of the residual spasm.</p><p><strong>Attention!</strong><br>With deep sliding palpation easy to get the &quot;Jump Effect&quot; - to touch a point so painful that you want to scream and jump is very likely. Deep cramps can be incredibly painful. Do not be afraid to work through such points. Hold in the place of acute pain for 20-30 seconds, breathe deeply and continue pressing. The pain will go away and you will notice how much better the neck feels. Even a feeling of clarity and lightness will appear in your head!</p><p><strong>Technique:<br></strong>With one hand, without tension, hold the skin in the clavicle area. Bow your head a little and with two or three fingers press deep into the muscles. Move slowly upward in a sliding motion, lingering at painful points.<br>Thus, we work out the entire surface of the neck, bypassing the Adam&#39;s apple / larynx zone. This massage can take a long time, you can combine it with watching TV or a movie.&nbsp;</p><p><strong>Do not rush!</strong> The better you can work the deep muscles of the neck, the sooner you will achieve noticeable results on your way to natural rejuvenation.</p><p>Share your impressions in the Question-Answer, how many &quot;jumping&quot; points were found?&nbsp;<span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f609.svg);">&nbsp;</span>&nbsp;</p>',
          marathonExerciseName: '2-5 minutes',
          order: 4,
          exerciseContents: [
            { type: 'image', contentPath: 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/BeautifyManContent/Images/beb7b391-e35a-44a0-b0ab-2a102c2d3d00.gif', order: 1, isActive: true },
            { type: 'video', contentPath: 'https://player.vimeo.com/video/581490077', order: 2, isActive: true }
          ]
        },
        {
          exerciseName: 'Cords relaxation',
          exerciseDescription: '<p><strong>Relaxation of the cords</strong></p><p>What are these chords? This is the platysma muscle that has broken down into bundles. If you strain your lower face and neck, you can easily see them. These fibrosed muscle bundles tighten the skin and severely spoil the appearance of the entire front of the neck. They are also the cause of impaired lymph outflow and the appearance of folds on the neck and double chin.<br>This simple trick will help:<br><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span>&nbsp; to improve the appearance and relief of the anterior surface of the neck.<br><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span>&nbsp; reduce wrinkles, folds, skin laxity.<br><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span>&nbsp; remove completely or significantly reduce the second chin.</p><p><strong>Technique:</strong><br><strong>1 action. Warm up.</strong><br>We grab the chord with our fingers. It is important to grab the bundle itself, not just the skin, try to find and hold it. If ,at first, the cord slips out of your fingers, just grab it again in the same place.<br>Hold for five seconds without releasing pressure, and then move on to the next section.<br>You need to work out cord along the entire length quite carefully. If you overdo it with massage, for a while the chord may become thicker and more noticeable. This is not critical, but it is important for us to avoid negative consequences. Remember that practicing on a daily basis is more important than intensity.<br>After the chord is warmed up, move on to stretching.<br><strong>2 Action. Stretching.</strong><br>We begin to stretch from below and slowly move higher and higher along the cord. Grab the cord with both hands. Fingers below are fixing and fingers on the other hand pull the cord along the length for about 1 inch, then fixing fingers are replaced closer to the stretching ones. Keep doing such stretching steps until the end of the cord under the lower jaw. Go first from bottom to top, and then return from top to button with the same stretching technique.</p><p>In the same manner, you need to massage all the chords that you find on your neck.</p><p>Good luck!<span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f609.svg);">&nbsp;</span>&nbsp;</p>',
          marathonExerciseName: 'all cords',
          order: 5,
          exerciseContents: [
            { type: 'image', contentPath: 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/BeautifyManContent/Images/4db66873-143f-4953-a244-6dd2427eab9a.gif', order: 1, isActive: true },
            { type: 'video', contentPath: 'https://player.vimeo.com/video/581490059', order: 2, isActive: true }
          ]
        },
        {
          exerciseName: 'Oral diaphragm lifting',
          exerciseDescription: '<p><strong>Oral diaphragm (Mylohyoid muscle) lifting.</strong><br>The area under the lower jaw often looks completely different from what we would like. The skin sags, chronic edema and double chin are formed. Because of this, the face looks much fuller and older than it actually is. A lifting of the diaphragm of the mouth will help to work out this area well.</p><p><br></p><p>&nbsp;With regular practice of this manual technique:<br><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span> the second chin will decrease or completely disappear,<br><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span> the oval of the face will become outlined,<br><span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f449.svg);">&nbsp;</span> jawline becomes well-defined.</p><p><strong>Attention!</strong><br>Be careful when you do lifting of the diaphragm of the mouth. In the area of the hyoid bone press deep, but gently. The muscles in this area are thin and can be harmed slightly, which can result in discomfort or ache when swallowing and chewing.</p><p><strong>Technique:</strong><br><strong>1 step. With fist.</strong><br>Push the entire surface under the lower jaw with one hand. To do this fold the hand into a fist, the phalanges of the fingers should fit into the space from the chin to the hyoid bone (next to the larynx). Push up the soft tissues of the lower jaw and stay in this position for about 20-30 seconds (4 inhale-exhale rounds).<br><strong>2 step. With thumbs.</strong><br>Set the joints of your thumbs on the chin with tips towards the hyoid bone.<br>Press with tips up so that the tongue is pushed against the palate. Keep the lower jaw relaxed, the mouth can get slightly open. Keep this press for 20-30 seconds or 4 inhale-exhale rounds.<br><strong>! Keep your neck straight, stretch the top of your head up.</strong><br><strong>3 step. Thumbs moved to corners.</strong><br>Reset the thumbs joints closer the jaw corners, tips should meet next to hyoid muscle. Press the tips up again pushing the tongue to your palate. Keep this press for 20-30 seconds or 4 inhale-exhale rounds.</p><p>In total this technique can take 1 or 2 minutes. If you got massive under chin area do it a bit longer.</p><p>Good luck on your way to a young face shape!<span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f917.svg);">&nbsp;</span>&nbsp;</p>',
          marathonExerciseName: '1-2 minutes',
          order: 6,
          exerciseContents: [
            { type: 'image', contentPath: 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/BeautifyManContent/Images/96a1534b-a227-47e0-a0c7-d446aab3b1dd.gif', order: 1, isActive: true },
            { type: 'video', contentPath: 'https://player.vimeo.com/video/581755349', order: 2, isActive: true }
          ]
        },
        {
          exerciseName: 'Double chin lifting',
          exerciseDescription: '<p><strong>Lifting of the double chin area</strong></p><p>You will be surprised, but the presence or absence of a double chin is not directly related to a person&#39;s weight. There are quite thin people with a definite double chin.<br>It&#39;s all about lymph! <span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f62a.svg);">&nbsp;</span> If the lymph flow along the neck is disturbed, lymph often stagnates the area under the mandible and the diaphragm of the mouth. Lymph congestion is gradually aggravated by the proliferation of tough connective tissue.<br>Our task here is to disentangle the tissues of the double chin area and expel excess fluid from the tissues. The lifting effect will follow! <span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f4aa.svg);">&nbsp;</span> <span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f44c.svg);">&nbsp;</span>&nbsp;</p><p><strong>Attention!</strong><br>Watch for changes in this area. You can drive off excess fluid quite quickly, but the tissues will not have time to tighten and instead of a double chin, you will get flabby sagging skin. Work thoughtfully. If you notice that the skin in the area of the double chin and neck has become more flabby, stop practicing this technique for a while. Focus on neck static, posture exercises.</p><p><strong>Technique:</strong><br><strong>1 action. Warming up.</strong><br>Warm up the tissues under the chin and on the front of the neck with light pinch massage movements. Keep doing this until you feel a pleasant warmth. Just as we did in the basic course.<br><strong>2 action. Squeezing.</strong><br><strong>1 step. Under the jaw.</strong><br>Place your thumb (it will be the fixing one) under the ear next to the lower jaw, and with all your other fingers try to collect all the tissues of the double chin area into one large array and start squeezing this fold towards the ear. Take your time, move the fold slowly, do not lose the array as you move. Move the fixing finger further to the back when needed. The farther you can push the the fold of tissues behind your ear, the better. If all of the array is not folded on the first try, rearrange the grip so that it grabs the untreated area.<br>In the same manner do this squeezing to the other side.<br><strong>2 step. Neck.</strong><br>Now we will work on the tissues along the front of the neck. Put the fixing finger in the middle of the lateral surface of the neck, grab the fold in the Adam&#39;s apple (just do not press on it, grab the soft tissues). Start squeezing the fold, try to pull it as far as possible, ideally to the back of the neck.<br>If all of the tissues are not folded on the first try, grab the tissues so that you can work out the untreated area.<br>Repeat step 2 on the opposite side.</p><p>Finish with an encouraging patting on the double chin area!&nbsp;<span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f44f.svg);">&nbsp;</span>&nbsp;</p><p>Good luck!&nbsp;<span class="fr-emoticon fr-deletable fr-emoticon-img" style="background: url(https://cdnjs.cloudflare.com/ajax/libs/emojione/2.0.1/assets/svg/1f609.svg);">&nbsp;</span>&nbsp;</p>',
          marathonExerciseName: '2-3 minutes',
          order: 7,
          exerciseContents: [
            { type: 'video', contentPath: 'https://player.vimeo.com/video/587092931', order: 1, isActive: true },
            { type: 'image', contentPath: 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/BeautifyManContent/Images/73a8253d-412d-4a99-922a-01486b28c93d.gif', order: 1, isActive: true }
          ]
        },
        {
          exerciseName: 'Erasing the neck lines',
          exerciseDescription: '<p><strong>Rubbing the neck lines</strong></p><p>Perpendicular lines, wrinkles, called the rings of Venus, are formed when there is an excess of soft tissue in the neck. To reverse this process and smooth the skin, the neck must return to its original, upright, position. Correct neck static can only be achieved when the crown of your head is above the shoulder line. I hope that your progress towards a young, straight and even neck is going well. &nbsp;<br>📸Check it out in the Photo Diary, compare your &quot;Before&quot; photos with the current ones. If you see that the neck has become longer, then it&#39;s time to start erasing the neck wrinkles. This neck line creases should already become less deep but still may be noticeable.</p><p>This technique will help make them even less visible. With time and diligence, you can make them barely visible even in a close-up picture.</p><p><strong>Important!</strong><br style="color: rgb(23, 43, 77); font-family: -apple-system, system-ui, &quot;Segoe UI&quot;, Roboto, &quot;Noto Sans&quot;, Ubuntu, &quot;Droid Sans&quot;, &quot;Helvetica Neue&quot;, sans-serif; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\">This exercise should be done after all neck exercises.</p><p><strong>Technique:</strong><br style="color: rgb(23, 43, 77); font-family: -apple-system, system-ui, &quot;Segoe UI&quot;, Roboto, &quot;Noto Sans&quot;, Ubuntu, &quot;Droid Sans&quot;, &quot;Helvetica Neue&quot;, sans-serif; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\">Determine the wrinkle you are going to massage. Find the starting point and the ending one. The starting point will be where the wrinkle has a thin end, the ending point is usually higher and goes towards the ear. If the wrinkle has already formed a semicircle from ear to ear or from one side of the neck to the other, then its center will be the starting point.<br style="color: rgb(23, 43, 77); font-family: -apple-system, system-ui, &quot;Segoe UI&quot;, Roboto, &quot;Noto Sans&quot;, Ubuntu, &quot;Droid Sans&quot;, &quot;Helvetica Neue&quot;, sans-serif; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\">Pinch the wrinkle at the starting point with your thumb and forefinger perpendicular to the line and start rubbing it. Rub at one point until you feel the wrinkle slip out of the clamp.</p><p>More than 10 rubbing movements at one point can be excessive, be careful.</p><p>Move your fingers closer to the end point and do the same rubbing. Pass this technique over the entire wrinkle, leaving no intact places. If you started at the center of the wrinkle, go back to the same spot and continue rubbing to another end point.</p><p>Work through all the lines on the neck in the same manner.</p><p>This technique takes a long time to work out all the lines but it really worth it.<br style="color: rgb(23, 43, 77); font-family: -apple-system, system-ui, &quot;Segoe UI&quot;, Roboto, &quot;Noto Sans&quot;, Ubuntu, &quot;Droid Sans&quot;, &quot;Helvetica Neue&quot;, sans-serif; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\">As always, regularity is more important than intensity. Be careful, if you overdo it, it is easy to get bruised. However, redness of the skin after such rubbing is normal, it will go away in a few minutes.</p><p>Good luck! 😉&nbsp;</p>',
          marathonExerciseName: 'all lines',
          order: 8,
          exerciseContents: [
            { type: 'image', contentPath: 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/BeautifyManContent/Images/14669a9a-08fb-4e91-b7bc-fad1f86bcf39.gif', order: 1, isActive: true },
            { type: 'video', contentPath: 'https://player.vimeo.com/video/587092953', order: 2, isActive: true }
          ]
        }
      ]
    }
  ]
};

// Маппинг категорий на теги (для связи с русскими упражнениями)
const CATEGORY_TAG_MAPPING: { [key: string]: string[] } = {
  'Lymphatic drainage': ['Lymph', 'Drainage', 'Detox'],
  'Posture': ['Neck', 'Posture', 'Stretching'],
  'Basic massages': ['Massage', 'Face', 'Basic'],
  'Advanced for the Neck': ['Neck', 'Advanced', 'PRO'],
  'Sculpting massage': ['Massage', 'Sculpting', 'Face'],
  'Vacuum massage': ['Massage', 'Vacuum', 'Face'],
  'Better in the evening': ['Evening', 'Relaxation', 'Spine']
};

async function importAllExercises() {
  try {
    console.log('🔌 Подключаемся к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено к MongoDB\n');

    const enTag = await getEnTag();
    const ruTag = await getRuTag();
    console.log(`✅ Теги: EN (${enTag.color}), RU (${ruTag.color})\n`);

    let totalImported = 0;
    let totalSkipped = 0;
    const exerciseLinks: Array<{ enId: string; ruId: string; enTitle: string; ruTitle: string; commonTags: number }> = [];

    // Получаем все русские упражнения для связывания
    const ruExercises = await Exercise.find({ tags: ruTag._id }).populate('tags');
    console.log(`📚 Загружено ${ruExercises.length} русских упражнений для связывания\n`);

    for (const category of COURSE_DATA.dayCategories) {
      console.log('='.repeat(70));
      console.log(`📂 КАТЕГОРИЯ: ${category.categoryName}`);
      console.log(`   Упражнений: ${category.exercises.length}`);
      console.log('='.repeat(70) + '\n');

      // Создаем теги для категории
      const categoryTagNames = CATEGORY_TAG_MAPPING[category.categoryName] || ['General'];
      const categoryTags = await Promise.all(
        categoryTagNames.map(async (name) => {
          const slug = name.toLowerCase().replace(/\s+/g, '-');
          let tag = await Tag.findOne({ slug });
          if (!tag) {
            tag = await Tag.create({
              name,
              slug,
              color: '#10B981',
              isVisible: true
            });
            console.log(`  ✅ Создан тег: #${name}`);
          }
          return tag;
        })
      );

      for (const oldExercise of category.exercises) {
        const exerciseName = oldExercise.exerciseName;

        try {
          // Проверяем существование
          let exercise = await Exercise.findOne({ title: exerciseName });

          if (exercise) {
            console.log(`  ⏭️  ${exerciseName} - уже существует`);
            totalSkipped++;
            continue;
          }

          // Конвертируем медиа
          const carouselMedia = oldExercise.exerciseContents
            .filter((content: any) => content.isActive)
            .sort((a: any, b: any) => a.order - b.order)
            .map((content: any) => {
              const url = content.contentPath || '';
              const filename = url.split('/').pop() || `${content.type}-${content.order}`;

              return {
                type: content.type === 'video' ? 'video' : 'image',
                url: url,
                filename: filename,
                order: content.order
              };
            });

          // Все теги для упражнения
          const allTags = [...categoryTags, enTag];

          // Создаем упражнение
          exercise = await Exercise.create({
            title: exerciseName,
            description: oldExercise.exerciseDescription || `<p>${exerciseName}</p>`,
            content: oldExercise.exerciseDescription || `<p>${exerciseName}</p>`,
            carouselMedia: carouselMedia,
            tags: allTags.map(tag => tag._id),
            duration: oldExercise.marathonExerciseName || '',
            order: oldExercise.order || 0,
            category: category.categoryName
          });

          console.log(`  ✅ ${exerciseName}`);
          console.log(`     Медиа: ${carouselMedia.length}, Длительность: ${exercise.duration}`);

          // Ищем русский аналог
          const enExTags = allTags.map(t => t._id.toString());

          for (const ruEx of ruExercises) {
            const ruExTags = (ruEx.tags as any[]).map(t => t._id.toString());

            // Общие теги (кроме EN/RU)
            const commonTags = enExTags.filter(tag =>
              ruExTags.includes(tag) &&
              tag !== enTag._id.toString() &&
              tag !== ruTag._id.toString()
            );

            // Если 2+ общих тега - возможная связь
            if (commonTags.length >= 2) {
              exerciseLinks.push({
                enId: exercise._id.toString(),
                ruId: ruEx._id.toString(),
                enTitle: exercise.title,
                ruTitle: ruEx.title,
                commonTags: commonTags.length
              });
              console.log(`     🔗 Связь с: "${ruEx.title}" (${commonTags.length} общих тегов)`);
            }
          }

          totalImported++;

        } catch (error: any) {
          console.error(`  ❌ Ошибка: ${exerciseName} - ${error.message}`);
          totalSkipped++;
        }
      }

      console.log('');
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 ИТОГОВАЯ СТАТИСТИКА');
    console.log('='.repeat(70));
    console.log(`✅ Импортировано:      ${totalImported}`);
    console.log(`⏭️  Пропущено:         ${totalSkipped}`);
    console.log(`📦 Всего:             ${totalImported + totalSkipped}`);
    console.log(`🔗 Найдено связей:    ${exerciseLinks.length}`);
    console.log(`🏷️  Курс:              ${COURSE_DATA.title}`);
    console.log('='.repeat(70));

    // Сохраняем связи в JSON
    if (exerciseLinks.length > 0) {
      const fs = require('fs');
      const linksPath = './exercise-links-advanced-neck.json';
      fs.writeFileSync(linksPath, JSON.stringify(exerciseLinks, null, 2));
      console.log(`\n💾 Связи сохранены в: ${linksPath}`);
    }

    console.log('\n✨ Импорт завершен!\n');

  } catch (error: any) {
    console.error('\n❌ ОШИБКА:', error.message);
    if (error.response) {
      console.error('Данные:', error.response.data);
    }
  } finally {
    await mongoose.connection.close();
    console.log('👋 Отключено от MongoDB');
  }
}

importAllExercises();
