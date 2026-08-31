import type {util} from 'zod'

export default defineAppConfig({
    picture: {
        acceptedImageTypes: ['image/webp', 'image/jpeg', 'image/png'] as util.MimeTypes[],
        siteName: 'Recipe Book',
    }
})
