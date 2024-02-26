import {SECRET_AWS_SECRET_ACCESS_KEY,
    SECRET_AWS_REGION,
    SECRET_BUCKET_NAME,
    SECRET_AWS_ENDPOINT_URL_S3,
    SECRET_AWS_ACCESS_KEY_ID} from '$env/static/private';
import { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const streamToString = (stream) =>
new Promise((resolve, reject) => {
  const chunks = [];
  stream.on("data", (chunk) => chunks.push(chunk));
  stream.on("error", reject);
  stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
});

export async function load({}){

try{
    const s3 = new S3Client({
        region: SECRET_AWS_REGION,
        endpoint: SECRET_AWS_ENDPOINT_URL_S3,
        credentials: {
            accessKeyId: SECRET_AWS_ACCESS_KEY_ID,
            secretAccessKey: SECRET_AWS_SECRET_ACCESS_KEY
        }
    });
    const list = new ListObjectsV2Command({
        Bucket: SECRET_BUCKET_NAME,
        MaxKeys: 1000

    });
    const {Contents} = await s3.send(list);
    console.log('List Result',Contents);
    const trainings = await Promise.all(Contents.map(async (item)=>{
        const getObject = new GetObjectCommand({
            Bucket: SECRET_BUCKET_NAME,
            Key: item.Key
        });
        const {Body} = await s3.send(getObject);
        const data = await streamToString(Body);
        const userObject = JSON.parse(data);
        //add the key to the userObject
        userObject.key = item.Key;
        //console.log('Data',data);
        return userObject;
    }));
    return {trainings};
}
catch(e){
    console.error(e);
}
}


export const actions={
    delete: async ({request})=>{
        const form = await request.formData();
        const selectedTrainings = form.get('selectedTrainings')??''; // email is used as key

        //console.log('selectedTrainings:',selectedTrainings);

        const ids = selectedTrainings.split(',');

        //console.log('ids:',ids);
    
        try{
            const s3 = new S3Client({
                region: SECRET_AWS_REGION,
                endpoint: SECRET_AWS_ENDPOINT_URL_S3,
                credentials: {
                    accessKeyId: SECRET_AWS_ACCESS_KEY_ID,
                    secretAccessKey: SECRET_AWS_SECRET_ACCESS_KEY
                }
            });

            //iterate through the ids and delete each one
            for (const id of ids) {
                const commandDetails = new DeleteObjectCommand({
                    Bucket: SECRET_BUCKET_NAME,
                    Key: id

                });

                const result = await s3.send(commandDetails);
                //console.log('Delete Result',result);
            }
            const message = ids.length === 1 ? 'Training Deleted' : 'Trainings Deleted';
            return {success: true, message: message};

            //console.log('Delete Result',result);

        }
        catch(e){
            console.error(e);
        }
    
    }
}