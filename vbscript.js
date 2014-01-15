if (IE_HACK) document.write('<script type="text/vbscript">\n\
    Function BinaryToArray(Binary)\n\
        Dim i\n\
        ReDim byteArray(LenB(Binary))\n\
        For i = 1 To LenB(Binary)\n\
            byteArray(i-1) = AscB(MidB(Binary, i, 1))\n\
        Next\n\
        BinaryToArray = byteArray\n\
    End Function\n\
</script>');
