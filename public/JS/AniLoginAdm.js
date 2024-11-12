//input emailadm:
document.getElementById('emailadm').addEventListener('input', function() {
    var inputValue = this.value;
    var labelemail = document.getElementById('labelemail');
   labelemail.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});

//input senha:
document.getElementById('senhaadm').addEventListener('input', function() {
    var inputValue = this.value;
    var labelsenha= document.getElementById('labelsenha');
   labelsenha.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});

