import { exec } from "child_process";

export const convertRecording = (recordingName: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const videoInput = `/recordings/${recordingName}-video-1.mjr`;

    const audioInput = `/recordings/${recordingName}-audio-0.mjr`;

    const tempVideo = `/converted/${recordingName}-video.webm`;

    const tempAudio = `/converted/${recordingName}-audio.opus`;

    const finalOutput = `/converted/${recordingName}.mp4`;

    const command = `docker exec janus-sfu sh -c "janus-pp-rec ${videoInput} ${tempVideo} && janus-pp-rec ${audioInput} ${tempAudio} && ffmpeg -y -i ${tempVideo} -i ${tempAudio} -c:v libx264 -c:a aac ${finalOutput}"`;

    console.log("========== RECORDING CONVERSION ==========");
    console.log("COMMAND:", command);

    exec(command, (error, stdout, stderr) => {
      console.log("===== STDOUT =====");
      console.log(stdout);

      console.log("===== STDERR =====");
      console.log(stderr);

      if (error) {
        console.log("===== CONVERSION ERROR =====");
        console.log(error);

        return reject(error);
      }

      /**
       * VERIFY FINAL MP4 EXISTS
       */
      const verifyCommand = `docker exec janus-sfu sh -c "test -f ${finalOutput}"`;

      exec(verifyCommand, (verifyError) => {
        if (verifyError) {
          console.log("===== MP4 FILE NOT FOUND =====");

          return reject(
            new Error("MP4 conversion failed. File not generated."),
          );
        }

        console.log("===== MP4 GENERATED SUCCESSFULLY =====");

        /**
         * CLEAN TEMP FILES
         */
        const cleanupCommand = `docker exec janus-sfu sh -c "rm -f ${videoInput} && rm -f ${audioInput} && rm -f ${tempVideo} && rm -f ${tempAudio}"`;

        exec(cleanupCommand, (cleanupError) => {
          if (cleanupError) {
            console.log("===== CLEANUP ERROR =====");
            console.log(cleanupError);
          } else {
            console.log("===== TEMP FILES CLEANED =====");
          }

          resolve(finalOutput);
        });
      });
    });
  });
};
