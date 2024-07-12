<template>
    <div class="column is-12">
        <b-button @click="clickMe">Click Me</b-button>
    </div>
</template>

<script>

export default {
    name: 'UploadComponent',
    props: {
        msg: String
    },
    methods: {
        clickMe() {
            this.$buefy.notification.open('Clicked!!')
        }
    }
}
</script>

<style></style>